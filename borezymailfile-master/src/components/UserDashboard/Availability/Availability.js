import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy,updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../../UserDashboard/UserHeader';
import UserSidebar from '../../UserDashboard/UserSidebar';
import { useUser } from '../../Auth/UserContext';
import search from '../../../assets/Search.png';
import { FaSearch, FaDownload, FaUpload, FaPlus, FaEdit, FaTrash, FaCopy } from 'react-icons/fa';
// import BookingDetailSidebar from './BookingDetailSidebar'; // Ensure this component exists
import './Availability.css'; // Create CSS for styling

const BookingDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  
  const [searchField, setSearchField] = useState('bookingCode');
  const [importedData, setImportedData] = useState(null);
  
  const navigate = useNavigate();
  const [stageFilter, setStageFilter] = useState('all'); // New state for filtering by stage
  const { userData } = useUser();
  
  // Assuming you have userData defined somewhere in your context or props
   // Replace this with actual user data

  useEffect(() => {
    const fetchAllBookingsWithUserDetails = async () => {
      setLoading(true); // Start loading
      try {
        // Query products based on the branch code
        const q = query(
          collection(db, 'products'),
          where('branchCode', '==', userData.branchCode)
        );
        const productsSnapshot = await getDocs(q);
        let allBookings = [];

        // Loop through products and get related bookings
        for (const productDoc of productsSnapshot.docs) {
          const productCode = productDoc.data().productCode;
          const bookingsRef = collection(productDoc.ref, 'bookings');
          const bookingsQuery = query(bookingsRef, orderBy('pickupDate', 'asc'));
          const bookingsSnapshot = await getDocs(bookingsQuery);

          bookingsSnapshot.forEach((doc) => {
            const bookingData = doc.data();
            const { 
              bookingId, 
              receiptNumber, 
              pickupDate, 
              returnDate, 
              quantity, 
              userDetails, 
              price, 
              deposit, 
              priceType, 
              minimumRentalPeriod, 
              discountedGrandTotal, 
              extraRent 
            } = bookingData;

            allBookings.push({
              productCode,
              bookingId, // The booking ID
              receiptNumber, // New field for receipt number
              username: userDetails.name,
              contactNo: userDetails.contact,
              email: userDetails.email,
              pickupDate: pickupDate.toDate(),
              returnDate: returnDate.toDate(),
              quantity: parseInt(quantity, 10),
              price, // Include price
              deposit, // Include deposit
              priceType, // Include price type
              minimumRentalPeriod, // Include minimum rental period
              discountedGrandTotal, // Include discounted grand total
              extraRent, // Include extra rent
              stage: userDetails.stage,
            });
          });
        }

        // Set bookings without filtering for unique contacts
        setBookings(allBookings); // Store all bookings
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchAllBookingsWithUserDetails();
  }, [userData.branchCode]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        // Add your delete logic here
      } catch (error) {
        console.error('Error deleting booking:', error);
      }
    }
  };

  const handleAddBooking = () => {
    navigate('/addbooking'); // Navigate to an add booking page
  };
  const handleStageChange = async (productCode, bookingId, newStage) => {
  console.log("Stage change initiated with:");
  console.log("Product Code:", productCode);
  console.log("Booking ID:", bookingId);
  console.log("New Stage:", newStage);

  if (!newStage) {
    console.error('Invalid stage selected:', newStage);
    return;
  }

  if (!productCode || !bookingId) {
    console.error('Missing productCode or bookingId:', { productCode, bookingId });
    return;
  }

  try {
    // Query for the document where bookingId matches
    const bookingsRef = collection(db, `products/${productCode}/bookings`);
    const q = query(bookingsRef, where("bookingId", "==", bookingId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error(`No booking found with bookingId: ${bookingId}`);
      return;
    }

    // Assume bookingId is unique, so take the first matching document
    const bookingDocRef = querySnapshot.docs[0].ref;

    // Update the stage field in Firestore
    await updateDoc(bookingDocRef, { 'userDetails.stage': newStage });
    console.log('Booking stage updated successfully!');

  } catch (error) {
    console.error('Error updating booking stage:', error);
  }
};

  

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setRightSidebarOpen(true);
  };

  const closeRightSidebar = () => {
    setRightSidebarOpen(false);
  };
  const handleSearch = () => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    if (lowerCaseQuery === '') {
      setBookings(bookings); // Show all bookings if search query is empty
    } else {
      const filteredBookings = bookings.filter(booking =>
        booking[searchField]?.toLowerCase().includes(lowerCaseQuery)
      );
      setBookings(filteredBookings);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [searchQuery, searchField]);

  const exportToCSV = () => {
    const csv = Papa.unparse(bookings);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'bookings.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: async (result) => {
          const importedBookings = result.data.filter(row => row && Object.keys(row).length > 0);
          
          if (importedBookings.length === 0) {
            console.warn('No bookings to import.');
            return;
          }

          await Promise.all(importedBookings.map(async (booking) => {
            try {
              if (!booking.bookingCode) {
                console.error('Booking code is missing:', booking);
                return;
              }

              const bookingRef = doc(db, 'bookings', booking.bookingCode);
              await setDoc(bookingRef, booking);
              console.log('Booking saved successfully:', booking);
            } catch (error) {
              console.error('Error saving booking to Firestore:', error, booking);
            }
          }));

          setImportedData(importedBookings); // Store the imported bookings locally if needed
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
        }
      });
    }
  };

  // Search function to filter bookings
  const filteredBookings = bookings.filter((booking) =>
    String(booking.bookingId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  
  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="dashboard-content">
        <UserHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <h2 style={{ marginLeft: '10px', marginTop: '100px' }}>
          Total Bookings
        </h2>
        <div className="filter-container">
          <button onClick={() => setStageFilter('all')}>All</button>
          <button onClick={() => setStageFilter('booking')}>Booking </button>
          <button onClick={() => setStageFilter('pickup')}>Pick Up</button>
          <button onClick={() => setStageFilter('pickupPending')}>Pickup Pending</button>
          <button onClick={() => setStageFilter('return')}>Return</button>
          <button onClick={() => setStageFilter('returnPending')}>Return Pending</button>
          <button onClick={() => setStageFilter('cancelled')}>Cancelled</button>
        </div>
        

        <div className="toolbar-container">
          <div className="search-bar-container9">
            <img src={search} alt="search icon" className="search-icon9" />
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="search-dropdown9"
            >
              <option value="bookingId">Booking ID</option>
              <option value="receiptNumber">Receipt Number</option>
              <option value="date">Date</option>
              <option value="status">Status</option>
            </select>
            <input
              type="text"
              placeholder={`Search by ${searchField.replace(/([A-Z])/g, ' $1')}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="action-buttons">
            <label className="export-button" onClick={exportToCSV}>
              <FaDownload />
              Export
            </label>
            <label htmlFor="import" className="import-button">
              <FaUpload />
              Import
              <input
                type="file"
                id="import"
                accept=".csv"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
            <label className="add-product-button" onClick={handleAddBooking}>
              <FaPlus />
              Add Booking
            </label>
          </div>
        </div>
        <div className="table-container">
          {loading ? (
            <p>Loading bookings...</p>
          ) : filteredBookings.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Receipt Number</th>
                  <th>Product Code</th>
                  <th>Username</th>
                  <th>Contact No</th>
                  <th>Email</th>
                  <th>Pickup Date</th>
                  <th>Return Date</th>
                  <th>Stage</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Deposit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.bookingId} onClick={() => handleBookingClick(booking)}>
                    <td>{booking.bookingId}</td>
                    <td>{booking.receiptNumber}</td> {/* Displaying receipt number */}
                    <td>{booking.productCode}</td>
                    <td>{booking.username}</td>
                    <td>{booking.contactNo}</td>
                    <td>{booking.email}</td>
                    <td>{new Date(booking.pickupDate).toLocaleDateString()}</td>
                    <td>{new Date(booking.returnDate).toLocaleDateString()}</td>
                    <td>
                        <select
                          value={booking.stage}
                          onChange={(e) => handleStageChange(booking.productCode, booking.bookingId, e.target.value)}
                        >
                          <option value="booking">Booking</option>
                          <option value="pickup">Pickup</option>
                          <option value="pickup pending">Pickup Pending</option>
                          <option value="return">Return</option>
                          <option value="returnPending">Return Pending</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    <td>{booking.quantity}</td>
                    <td>{booking.price}</td> {/* Displaying price */}
                    <td>{booking.deposit}</td> {/* Displaying deposit */}
                    <td>
                      <div className="action-buttons">
                        <label onClick={() => handleEdit(booking.id)}><FaEdit style={{ color: '#757575', cursor: 'pointer' }} /></label>
                        <label onClick={() => handleDelete(booking.id)}><FaTrash style={{ color: '#757575', cursor: 'pointer' }} /></label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No bookings found</p>
          )}
        </div>
       
      </div>
    </div>
  );
};

export default BookingDashboard;
