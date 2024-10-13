import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../../UserDashboard/UserHeader';
import UserSidebar from '../../UserDashboard/UserSidebar';
import { useUser } from '../../Auth/UserContext';
import search from '../../../assets/Search.png';
import { FaSearch, FaDownload, FaUpload, FaPlus, FaEdit, FaTrash, FaCopy } from 'react-icons/fa';
import './Availability.css'; // Create CSS for styling
import RightSidebar from './BRightsidebar';
const BookingDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptNumber, setSelectedReceiptNumber] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  
  const [searchField, setSearchField] = useState('bookingCode');
  const [importedData, setImportedData] = useState(null);
  
  const navigate = useNavigate();
  const [stageFilter, setStageFilter] = useState('all'); // New state for filtering by stage
  const { userData } = useUser();


  const handleBookingClick = (booking) => {
    setSelectedReceiptNumber(booking.receiptNumber); // Set the selected receipt number
    setRightSidebarOpen(true);
  };

  const closeRightSidebar = () => {
    setRightSidebarOpen(false);
    setSelectedReceiptNumber(null); // Reset when sidebar is closed
  };

  
  useEffect(() => {
    const fetchAllBookingsWithUserDetails = async () => {
      setLoading(true); // Start loading
      try {
        const q = query(
          collection(db, 'products'),
          where('branchCode', '==', userData.branchCode)
        );
        const productsSnapshot = await getDocs(q);
        let allBookings = [];
  
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
              bookingId,
              receiptNumber,
              username: userDetails.name,
              contactNo: userDetails.contact,
              email: userDetails.email,
              pickupDate: pickupDate.toDate(),
              returnDate: returnDate.toDate(),
              
              priceType,
              minimumRentalPeriod,
              discountedGrandTotal,
              extraRent,
              stage: userDetails.stage,
              products: [{ productCode, quantity: parseInt(quantity, 10),price,deposit, },], // Store product codes with quantities
            });
          });
        }
  
        // Group bookings by receiptNumber
        const groupedBookings = allBookings.reduce((acc, booking) => {
          const { receiptNumber, products } = booking;
          if (!acc[receiptNumber]) {
            acc[receiptNumber] = { ...booking, products: [...products] }; // Copy products array
          } else {
            acc[receiptNumber].products.push(...products); // Merge products arrays
          }
          return acc;
        }, {});
  
        // Convert grouped bookings object to array
        setBookings(Object.values(groupedBookings));
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
      const bookingsRef = collection(db, `products/${productCode}/bookings`);
      const q = query(bookingsRef, where("bookingId", "==", bookingId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error(`No booking found with bookingId: ${bookingId}`);
        return;
      }

      const bookingDocRef = querySnapshot.docs[0].ref;
      await updateDoc(bookingDocRef, { 'userDetails.stage': newStage });
      console.log('Booking stage updated successfully!');

    } catch (error) {
      console.error('Error updating booking stage:', error);
    }
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
  
  // Add a filter based on the stageFilter
  const finalFilteredBookings = filteredBookings.filter((booking) => {
    if (stageFilter === 'all') {
      return true; // Include all bookings if "all" is selected
    }
    return booking.stage === stageFilter; // Match booking stage
  });

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
          <button onClick={() => setStageFilter('Booking')}>Booking </button>
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
              className="search-field"
            >
              <option value="bookingId">Booking ID</option>
              <option value="receiptNumber">Receipt Number</option>
              <option value="productCode">Product Code</option>
              <option value="username">Username</option>
              <option value="contactNo">Contact No</option>
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              placeholder="Search..."
            />
            <button onClick={handleSearch} className="search-button">Search</button>
          </div>
          <div className="toolbar-actions">
            <button className="action-button" onClick={exportToCSV}>
              <FaDownload /> Export
            </button>
            <label htmlFor="file-upload" className="action-button">
              <FaUpload /> Import
              <input
                id="file-upload"
                type="file"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
            <button className="action-button" onClick={handleAddBooking}>
              <FaPlus /> Add Booking
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading bookings...</p>
        ) : (
          <div className="booking-list">
            {finalFilteredBookings.length > 0 ? (
              <table className="booking-table">
                <thead>
                  <tr>
                    <th>Receipt Number</th>
                    <th>Product Codes</th>
                    <th>Username</th>
                    <th>Contact No</th>
                    <th>Email</th>
                    <th>Pickup Date</th>
                    <th>Return Date</th>
                    <th>Quantity</th>
                    <th>Stage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {finalFilteredBookings.map((booking) => (
                     <tr key={booking.bookingId} onClick={() => handleBookingClick(booking)}>
                      <td>{booking.receiptNumber}</td>
                      <td>
                            {booking.products.map((product) => (
                            <div key={product.productCode}>
                                {product.productCode}: {product.quantity}
                            </div>
                            ))}
                        </td>
                      <td>{booking.username}</td>
                      <td>{booking.contactNo}</td>
                      <td>{booking.email}</td>
                      <td>{booking.pickupDate.toLocaleString()}</td>
                      <td>{booking.returnDate.toLocaleString()}</td>
                      <td>{booking.quantity}</td>
                      <td>
                        <select
                          value={booking.stage}
                          onChange={(e) => handleStageChange(booking.productCode, booking.bookingId, e.target.value)}
                        >
                          <option value="Booking">Booking</option>
                          <option value="pickup">Pick Up</option>
                          <option value="pickupPending">Pickup Pending</option>
                          <option value="return">Return</option>
                          <option value="returnPending">Return Pending</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <button className="delete-button" onClick={() => handleDelete(booking.bookingId)}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No bookings found.</p>
            )}
          </div>
        )}
      </div>
      <RightSidebar 
        isOpen={rightSidebarOpen} 
        booking={bookings.find(booking => booking.receiptNumber === selectedReceiptNumber)}
        onClose={closeRightSidebar} 
          // Pass the selected receipt number
      />
    </div>
  );
};

export default BookingDashboard;
