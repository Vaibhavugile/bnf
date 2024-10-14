import React, { useState,useEffect } from 'react';
import { db } from '../../../firebaseConfig';
import { collection, doc, addDoc, getDoc, query, getDocs, orderBy, writeBatch, where,setDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL,listAll } from "firebase/storage"; 
import { useNavigate } from 'react-router-dom';
import UserHeader from '../../UserDashboard/UserHeader';
import UserSidebar from '../../UserDashboard/UserSidebar';
import { useUser } from '../../Auth/UserContext';

import { FaSearch, FaDownload, FaUpload, FaPlus, FaEdit, FaTrash, FaCopy } from 'react-icons/fa';
import "../Availability/Booking.css"
function Booking() {

  const [productCode, setProductCode] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false); 
  const [isAvailabilityFormVisible, setIsAvailabilityFormVisible] = useState(true); 
  const [isAvailability1FormVisible, setIsAvailability1FormVisible] = useState(false); 
  const [receiptNumber, setReceiptNumber] = useState('');

  
  const [visibleForm, setVisibleForm] = useState(''); // Track visible form by its id
  const [userDetails, setUserDetails] = useState({ name: '', email: '', contact: '',assignedto:'',stage: 'Booking' });
  const [firstProductDates, setFirstProductDates] = useState({
    pickupDate: '',
    returnDate: ''
  });

  const [receipt, setReceipt] = useState(null); // Store receipt details
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false); // Track if payment is confirmed
  const [productImageUrl, setProductImageUrl] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [availableQuantity, setAvailableQuantity] = useState(null);
  const [deposit, setDeposit] = useState(0); // Add a state for deposit
  const [price, setPrice] = useState(0); // Add a state for price
  const [numDays, setNumDays] = useState(0);
  const [loggedInBranchCode, setLoggedInBranchCode] = useState('');
  const { userData } = useUser();
  const [discount, setDiscount] = useState(0); // State for the discount input
const [discountedGrandTotal, setDiscountedGrandTotal] = useState(0); // State for the updated grand total

// Handle discount change
const handleDiscountChange = (e) => {
  const discountAmount = parseFloat(e.target.value) || 0;
  setDiscount(discountAmount);
};

// Recalculate the discounted grand total whenever the discount or receipt changes
useEffect(() => {
  if (receipt) {
    const originalGrandTotal = receipt.products.reduce((sum, product) => sum + parseFloat(product.grandTotal), 0);
    const newGrandTotal = originalGrandTotal - discount;
    setDiscountedGrandTotal(newGrandTotal > 0 ? newGrandTotal : 0); // Ensure the grand total doesn't go below 0
  }
}, [discount, receipt]);


// Example: After user login or fetching user data
  



   // Number of days between pickup and return
  const [products, setProducts] = useState([
    {  pickupDate: '', returnDate: '', productCode: '',  quantity: '', availableQuantity: null, errorMessage: '',price:'',deposit:'',productName:'',},
  ]);
  const navigate = useNavigate();
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  
 

  
  
  // Function to fetch product image, price, and deposit based on productCode
  const fetchProductDetails = async (productCode, index) => {
    try {
      const productRef = doc(db, 'products', productCode);
      const productDoc = await getDoc(productRef);
     
      setLoggedInBranchCode(userData.branchCode);
  
      if (productDoc.exists()) {
        const productData = productDoc.data();
  
        const productBranchCode = productData.branchCode || '';
        if (productBranchCode === loggedInBranchCode) {
          const imagePath = productData.imageUrls ? productData.imageUrls[0] : null;
          const price = productData.price || 'N/A';
          const priceType = productData.priceType || 'daily';
          const deposit = productData.deposit || 'N/A';
          const totalQuantity = productData.quantity || 0;
          const minimumRentalPeriod = productData.minimumRentalPeriod || 1;
          const extraRent = productData.extraRent || 0;
          const productName = productData.productName || 'N/A';
  
          let imageUrl = null;
          if (imagePath) {
            const storage = getStorage();
            const imageRef = ref(storage, imagePath);
            imageUrl = await getDownloadURL(imageRef);
          } else {
            imageUrl = 'path/to/placeholder-image.jpg';
          }
  
          // Prevent unnecessary state updates
          setProducts((prevProducts) => {
            const newProducts = [...prevProducts];
            if (
              newProducts[index].price !== price ||
              newProducts[index].imageUrl !== imageUrl ||
              newProducts[index].deposit !== deposit
            ) {
              newProducts[index] = {
                ...newProducts[index],
                imageUrl,
                price,
                deposit,
                totalQuantity,
                priceType,
                minimumRentalPeriod,
                extraRent,
                productName,
              };
            }
            return newProducts;
          });
        } else {
          console.log('Product does not belong to this branch.');
        }
      } else {
        console.log('Product not found in Firestore.');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };
  const generateReceiptNumber = async () => {
    const receiptCounterRef = doc(db, 'counters', 'receiptNumber'); // Store the receipt number counter in Firestore
    const receiptCounterDoc = await getDoc(receiptCounterRef);
  
    let receiptNumber = 1; // Default to 1 if no counter exists
  
    if (receiptCounterDoc.exists()) {
      const data = receiptCounterDoc.data();
      receiptNumber = data.currentValue + 1; // Increment the counter
    }
  
    // Update the counter in Firestore
    await setDoc(receiptCounterRef, { currentValue: receiptNumber });
  
    // Format the receipt number (e.g., add leading zeros)
    return `REC-${String(receiptNumber).padStart(6, '0')}`; // REC-000001
  };

  function getCurrentDate() {
    const today = new Date();
    // Format date to YYYY-MM-DDTHH:MM (datetime-local format)
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Add leading zero to month
    const day = today.getDate().toString().padStart(2, '0'); // Add leading zero to day
    const hours = today.getHours().toString().padStart(2, '0'); // Add leading zero to hours
    const minutes = today.getMinutes().toString().padStart(2, '0'); // Add leading zero to minutes
  
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  
  
  

  const handleFirstProductDateChange = (e, field, index) => {
    const newProducts = [...products];
    const value = e.target.value;

    // Ensure pickupDate is not earlier than today
    if (field === 'pickupDate') {
        const today = new Date();
        const selectedDate = new Date(value);

        // Check if selected pickupDate is in the past
        if (selectedDate < today) {
            alert('Pickup date cannot be in the past.');
            return;
        }
    }

    // Update the field value for the selected product
    newProducts[index][field] = value;

    // If first product, update the firstProductDates state
    if (index === 0) {
        setFirstProductDates({
            ...firstProductDates,
            [field]: value
        });
    }

    setProducts(newProducts);
};

  
  // Function to handle product input changes
  const handleProductChange = (index, event) => {
    const { name, value } = event.target;
    const newProducts = [...products];
    newProducts[index][name] = value;
  
    if (name === 'productCode') {
      fetchProductDetails(value, index); // Fetch image, price, and deposit when productCode is entered
    }
  
    setProducts(newProducts);
    
  };
  
  
  const checkAvailability = async (index) => {
    const { productCode, pickupDate, returnDate, quantity } = products[index];
    const pickupDateObj = new Date(pickupDate);
    const returnDateObj = new Date(returnDate);
    const bookingId = await getNextBookingId(pickupDateObj,productCode);
     // Replace with actual booking ID logic if needed

    try {
      const productRef = doc(db, 'products', productCode);
      const productDoc = await getDoc(productRef);

      if (!productDoc.exists()) {
        const newProducts = [...products];
        newProducts[index].errorMessage = 'Product not found.';
        setProducts(newProducts);
        return;
      }

      const productData = productDoc.data();
      const maxAvailableQuantity = productData.quantity || 0;

      const bookingsRef = collection(productRef, 'bookings');
      const qLess = query(bookingsRef, where('bookingId', '<', bookingId), orderBy('bookingId', 'asc'));
      const qGreater = query(bookingsRef, where('bookingId', '>', bookingId), orderBy('bookingId', 'asc'));

      const querySnapshotLess = await getDocs(qLess);
      const querySnapshotGreater = await getDocs(qGreater);

      const bookingsLess = [];
      const bookingsGreater = [];

      querySnapshotLess.forEach((doc) => {
        const bookingData = doc.data();
        bookingsLess.push({
          bookingId: bookingData.bookingId,
          pickupDate: bookingData.pickupDate.toDate(),
          returnDate: bookingData.returnDate.toDate(),
          quantity: bookingData.quantity,
        });
      });

      querySnapshotGreater.forEach((doc) => {
        const bookingData = doc.data();
        bookingsGreater.push({
          bookingId: bookingData.bookingId,
          pickupDate: bookingData.pickupDate.toDate(),
          returnDate: bookingData.returnDate.toDate(),
          quantity: bookingData.quantity,
        });
      });
      console.log('Bookings Less:', bookingsLess);  // Log bookings before current booking
      console.log('Bookings Greater:', bookingsGreater);  // Log bookings after current booking
  

      let availableQuantity = maxAvailableQuantity;

      if (bookingsLess.length > 0 && bookingsGreater.length === 0) {
        const overlappingBooking = bookingsLess.find(
          (booking) => booking.returnDate > pickupDateObj
        );

        if (overlappingBooking) {
          availableQuantity -= overlappingBooking.quantity;
        }
      } else if (bookingsGreater.length > 0 && bookingsLess.length === 0) {
        const overlappingBookings = bookingsGreater.filter(
          (booking) => booking.pickupDate < returnDateObj
        );

        if (overlappingBookings.length > 0) {
          const totalOverlapQuantity = overlappingBookings.reduce((sum, booking) => sum + booking.quantity, 0);
          availableQuantity -= totalOverlapQuantity;
        }
      } else if (bookingsLess.length > 0 && bookingsGreater.length > 0) {
        const lessOverlapBooking = bookingsLess.find(
          (booking) => booking.returnDate > pickupDateObj
        );
        const greaterOverlapBookings = bookingsGreater.filter(
          (booking) => booking.pickupDate < returnDateObj
        );

        let totalOverlapQuantity = 0;

        if (lessOverlapBooking) {
          totalOverlapQuantity += lessOverlapBooking.quantity;
        }

        if (greaterOverlapBookings.length > 0) {
          totalOverlapQuantity += greaterOverlapBookings.reduce((sum, booking) => sum + booking.quantity, 0);
        }

        availableQuantity -= totalOverlapQuantity;
      }

      if (availableQuantity < 0) {
        availableQuantity = 0;
      }
  

      const newProducts = [...products];
      newProducts[index].availableQuantity = availableQuantity;
      newProducts[index].errorMessage = ''; // Clear error message if successful
      setProducts(newProducts);

    } catch (error) {
      console.error('Error checking availability:', error);
      const newProducts = [...products];
      newProducts[index].errorMessage = 'Failed to check availability. Please try again.';
      setProducts(newProducts);
    }
  };

  const addProductForm = () => {
    setProducts([...products, {  pickupDate: firstProductDates.pickupDate, returnDate: firstProductDates.returnDate,productCode: '', quantity: '', availableQuantity: null, errorMessage: '', productImageUrl: '',productName:'', }]);
  };
  const removeProductForm = (index) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
  };





  const getNextBookingId = async (pickupDateObj, productCode) => {
    try {
      // Check if productCode is valid
      if (!productCode) {
        throw new Error('Invalid product code');
      }
  
      // Firestore reference to the specific product's bookings
      const productRef = doc(db, 'products', productCode);
      const bookingsRef = collection(productRef, 'bookings');
      const q = query(bookingsRef, orderBy('pickupDate', 'asc'));
  
      const querySnapshot = await getDocs(q);
  
      const existingBookings = [];
  
      // Loop through the query snapshot to gather existing bookings
      querySnapshot.forEach((doc) => {
        const bookingData = doc.data();
        existingBookings.push({
          id: doc.id,
          bookingId: bookingData.bookingId,
          pickupDate: bookingData.pickupDate.toDate(),
          returnDate: bookingData.returnDate.toDate(),
          quantity: bookingData.quantity,
          


        });
      });
  
      // Calculate the next booking ID
      let newBookingId = existingBookings.length + 1;
      for (let i = 0; i < existingBookings.length; i++) {
        if (pickupDateObj < existingBookings[i].pickupDate) {
          newBookingId = i + 1;
          break;
        }
      }
  
      // Update existing bookings if necessary
      const batch = writeBatch(db);
      if (newBookingId <= existingBookings.length) {
        existingBookings.forEach((booking, index) => {
          if (index + 1 >= newBookingId) {
            const bookingDocRef = doc(bookingsRef, booking.id);
            batch.update(bookingDocRef, {
              bookingId: index + 2,
            });
          }
        });
      }
  
      await batch.commit();
  
      // Return the new booking ID for the current product
      return newBookingId;
    } catch (error) {
      console.error('Error getting next booking ID:', error);
      setErrorMessage('Failed to get booking ID. Please try again.');
      return null;
    }
  };
  
  
  
  

  

  const handleBookingConfirmation = async (e) => {
    e.preventDefault();
    
    try {
      const receiptNumber = await generateReceiptNumber();
      setReceiptNumber(receiptNumber); 
      let bookingDetails = [];
  
      for (const product of products) {
        const pickupDateObj = new Date(product.pickupDate);
        const returnDateObj = new Date(product.returnDate);
        const millisecondsPerDay = 1000 * 60 * 60 * 24;
        const days = Math.ceil((returnDateObj - pickupDateObj) / millisecondsPerDay);
  
        const productRef = doc(db, 'products', product.productCode);
        const productDoc = await getDoc(productRef);
  
        if (!productDoc.exists()) {
          product.errorMessage = 'Product not found.';
          continue; // Skip this product if not found
        }
  
        const productData = productDoc.data();
        const { price, deposit,priceType,minimumRentalPeriod,extraRent ,productName} = productData;
        const calculateTotalPrice = (price, deposit, priceType, quantity, pickupDate, returnDate, minimumRentalPeriod,extraRent) => {
          const pickupDateObj = new Date(pickupDate);
          const returnDateObj = new Date(returnDate);
          const millisecondsPerDay = 1000 * 60 * 60 * 24;
          const millisecondsPerHour = 1000 * 60 * 60;
          
          let duration=0;
          
          // Determine the duration based on priceType
          if (priceType === 'hourly') {
            duration = Math.ceil((returnDateObj - pickupDateObj) / millisecondsPerHour); 
             // Hours difference
          } else if (priceType === 'monthly') {
            duration = Math.ceil((returnDateObj - pickupDateObj) / (millisecondsPerDay * 30)); 
            // Months difference
          } else {
            duration = Math.ceil((returnDateObj - pickupDateObj) / millisecondsPerDay);
            
          }
          
            let fullPeriods = Math.floor(duration / minimumRentalPeriod); // Full multiples of the minimum rental period
            let remainingDuration = duration % minimumRentalPeriod; // Extra time beyond the full periods

            let totalPrice = 0;

            if (fullPeriods === 0) {
              // If full periods is 0, apply the base price for the entire duration
              totalPrice = price * quantity;
            } else {
              // Calculate price for the full periods
              totalPrice = price * fullPeriods * quantity;

              // Add extra price for the remaining duration beyond full periods
              if (remainingDuration > 0) {
                totalPrice += extraRent * remainingDuration * quantity;
              }
            }
          console.log("Price Type: ", priceType);
          console.log("Duration: ", duration);
          console.log("Full Periods: ", fullPeriods);
          console.log("Remaining Days/Hours: ", remainingDuration);
          console.log("Price per unit: ", price);
          console.log("Extra Price per additional duration: ", extraRent);
          console.log("Calculated Total Price: ", totalPrice);
        
         return {
            totalPrice,
            deposit,
            grandTotal: `${parseInt (totalPrice) + parseInt(deposit)}`,
            
          };
        };
        const totalCost = calculateTotalPrice(
          price, 
          deposit, 
          priceType, 
          product.quantity, 
          pickupDateObj, 
          returnDateObj,
          minimumRentalPeriod,
          extraRent,
        );
        
  
        
  
        const newBookingId = await getNextBookingId(pickupDateObj, product.productCode);
  
        // Log booking details for debugging
        console.log("Booking details:", {
          bookingId: newBookingId,
          pickupDate: pickupDateObj,
          returnDate: returnDateObj,
          quantity: parseInt(product.quantity, 10),
          userDetails,
          price,
          deposit,
          totalCost: totalCost.totalPrice,
          productName,
        });
  
        // Save booking details to Firestore
        
  
        bookingDetails.push({
          productCode: product.productCode,
          productImageUrl: product.imageUrl,
          deposit,
          price,
          numDays: days,
          quantity: product.quantity,
          totalPrice: totalCost.totalPrice,
          grandTotal: totalCost.grandTotal,
          productName,
        });
      }
  
      setReceipt({
        products: bookingDetails,
      });
  
    } catch (error) {
      console.error('Error confirming booking:', error);
      setErrorMessage('An error occurred while confirming your booking. Please try again.');
    }
  };
  
  


  const handleConfirmPayment = async () => {
    try {
      const receiptNumber = await generateReceiptNumber();
      setReceiptNumber(receiptNumber); 
      const allQuantitiesAvailable = await Promise.all(
        products.map(async (product) => {
          const productRef = doc(db, 'products', product.productCode);
          const productDoc = await getDoc(productRef);
  
          if (!productDoc.exists()) {
            product.errorMessage = 'Product not found.';
            console.log(`Product not found for code: ${product.productCode}`);
            return false; // Skip this product if not found
          }
  
          const productData = productDoc.data();
          const availableQuantity = parseInt(product.availableQuantity || 0, 10); // Ensure integer conversion
          const requestedQuantity = parseInt(product.quantity, 10); // Ensure integer conversion for requested quantity
  
          // Log the values to ensure they are correct
          console.log(`Product Code: ${product.productCode}`);
          console.log(`Available Quantity: ${availableQuantity}`);
          console.log(`Requested Quantity: ${requestedQuantity}`);
  
          // Check if the requested quantity is within the available stock
          if (requestedQuantity > availableQuantity) {
            console.log(`Not enough stock for product: ${product.productCode}`);
            product.errorMessage = 'Insufficient stock for this product.';
            return false; // Return false if not enough stock
          }
  
          return true; // Return true if sufficient stock
        })
      );
  
      // Check if all products have sufficient stock
      const allAvailable = allQuantitiesAvailable.every((isAvailable) => isAvailable);
      if (!allAvailable) {
        alert('One or more products do not have enough stock. Please adjust the quantity.');
        return; // Exit the function without proceeding with booking
      }
      
  
      // Check if all products have sufficient stock
      
      for (const product of products) {
      const pickupDateObj = new Date(product.pickupDate);
      const returnDateObj = new Date(product.returnDate);
      const productRef = doc(db, 'products', product.productCode);
      
        const productDoc = await getDoc(productRef);
  
        if (!productDoc.exists()) {
          product.errorMessage = 'Product not found.';
          continue; // Skip this product if not found
        }
        const productData = productDoc.data();
        const { price, deposit, priceType,minimumRentalPeriod,extraRent } = productData;
        const calculateTotalPrice = (price, deposit, priceType, quantity, pickupDate, returnDate,minimumRentalPeriod) => {
          const pickupDateObj = new Date(pickupDate);
          const returnDateObj = new Date(returnDate);
          const millisecondsPerDay = 1000 * 60 * 60 * 24;
          const millisecondsPerHour = 1000 * 60 * 60;
          
          let duration=0;
          
          // Determine the duration based on priceType
          if (priceType === 'hourly') {
            duration = Math.ceil((returnDateObj - pickupDateObj) / millisecondsPerHour); 
            if (minimumRentalPeriod) {
              duration = Math.ceil(duration / minimumRentalPeriod); // Ensure duration is at least the minimum rental period
              }  // Hours difference
          } else if (priceType === 'monthly') {
            duration = Math.ceil((returnDateObj - pickupDateObj) / (millisecondsPerDay * 30));
            if (minimumRentalPeriod) {
              duration = Math.ceil(duration / minimumRentalPeriod); // Ensure duration is at least the minimum rental period
              }  // Months difference
          } else {
            duration = Math.ceil((returnDateObj - pickupDateObj) / millisecondsPerDay);
            if (minimumRentalPeriod) {
              duration = Math.ceil(duration / minimumRentalPeriod); // Ensure duration is at least the minimum rental period
              }  // Days difference
          }
          console.log("Price Type: ", priceType);
          console.log("Duration: ", duration);
          console.log("Price per unit: ", price);
          console.log("Quantity: ", quantity);
          console.log("minimumrentalprice",minimumRentalPeriod);
          
          const totalPrice = price * duration * quantity;
          console.log("Calculated Total Price: ", totalPrice);
          return {
            totalPrice,
            deposit,
            grandTotal: totalPrice + deposit,
          };
        };
        const totalCost = calculateTotalPrice(
          price, 
          deposit, 
          priceType, 
          product.quantity, 
          pickupDateObj, 
          returnDateObj,
          minimumRentalPeriod
        );
        
  
  

      
  
      const newBookingId = await getNextBookingId(pickupDateObj, product.productCode);
      // Ensure receipt.products is an array
      await addDoc(collection(productRef, 'bookings'), {
        bookingId: newBookingId,
        receiptNumber,
        pickupDate: pickupDateObj,
        returnDate: returnDateObj,
        quantity: parseInt(product.quantity, 10),
        userDetails, // Assuming userDetails is the same for all products
        price, // Save price
        deposit,
        priceType,
        minimumRentalPeriod,
        discountedGrandTotal,
        
        extraRent,
        
         // Save deposit
        totalCost: totalCost.totalPrice, // Save total price
      });
    }
   
  

  
      // Iterate through each product and validate its details
      
  
      setIsPaymentConfirmed(true);
      alert('Payment confirmed ',receiptNumber);
      navigate('/thank-you');
    } catch (error) {
      console.error('Error confirming payment:', error);
      setErrorMessage(error.message);
    }
  };
  

  
  

  
  
  const toggleAvailabilityForm = () => {
    setIsAvailabilityFormVisible(!isAvailabilityFormVisible);
  };

  const toggleAvailability1Form = () => {
    
      // Function to check if all entered quantities are less than or equal to available quantities
      const allQuantitiesAvailable = products.every(product => {
        return parseInt(product.quantity, 10) <= (product.availableQuantity || 0);
      });
    
      if (allQuantitiesAvailable) {
        setIsAvailability1FormVisible(!isAvailability1FormVisible);
      } else {
        alert('Entered quantities exceed available quantities for one or more products.');
      }
    
  };

  // const handleDeleteProduct = (index) => {
  //   // Create a copy of the products array without the product at the specified index
  //   const updatedProducts = receipt.products.filter((_, productIndex) => productIndex !== index);
  
  //   // Update the receipt object with the new product list
  //   setReceipt((prevReceipt) => ({
  //     ...prevReceipt,
  //     products: updatedProducts,
  //   }));
    
  //   // Optionally, update the total price and other related calculations here
  // };

  const handleDeleteProduct = (productCode) => {
    // Update products state by filtering out the deleted product
    setProducts((prevProducts) => 
      prevProducts.filter((product) => product.productCode !== productCode)
    );
  
    // Update receipt state if you have a separate receipt state
    setReceipt((prevReceipt) => ({
      ...prevReceipt,
      products: prevReceipt.products.filter((product) => product.productCode !== productCode)
    }));
  };
  

  return (
    <div className="booking-container1">
      <UserHeader onMenuClick={toggleSidebar} />
     <div className='issidebar'>
     <UserSidebar isOpen={isSidebarOpen} />
     <button onClick={toggleAvailabilityForm} className='availability-toogle-button'>
          {isAvailabilityFormVisible ? 'Hide Availability Form' : 'Show Availability Form'}
      </button>
      
      {isAvailabilityFormVisible  && (
     
     <div>
      <h8>Check Product Availability </h8>
      {products.map((product, index) => (
        <div key={index} className="product-check" style={{ marginBottom: '20px',  padding: '10px', border: '1px solid #ddd',background:'#ffffff',}}>
          <div className="date-row" style={{  width: '700px',display:'flex',marginTop: '100px', }}>
           <div className="form-group1" style={{ flex: '0 0 45%', marginRight: '0px' }}>
             <label>Pickup Date</label>
             <input
              type="datetime-local"
              name="pickupDate"
              value={product.pickupDate}
              onChange={e => handleFirstProductDateChange(e, 'pickupDate', index)}
              min={getCurrentDate()}
              disabled={index > 0}
              required
             />
           </div>
            <div className="form-group1" style={{ flex: '0 0 45%',marginLeft:"70px"}} >
              <label>Return Date</label>
             <input
              type="datetime-local"
              name="returnDate"
              value={product.returnDate}
              onChange={e => handleFirstProductDateChange(e, 'returnDate', index)}
              disabled={index > 0} 
              required
             />
            </div>
          </div>
          <div className="form-group1" >
            <label>Product Code</label>
            <input
              type="text"
              name="productCode"
              value={product.productCode}
              onChange={(e) => handleProductChange(index, e)} 
              required
            />
          </div>
         
          
          <div className="form-group1">
            <label>Quantity</label>
            <input
              type="number"
              name="quantity"
              value={product.quantity}
              onChange={(e) => handleProductChange(index, e)}
              required
            />
          </div>
          <div className="form-group1">
            <label>Product Name</label>
            <input
              type="text"
              name="productName"
              value={product.productName}
              readOnly
              
           
            />
          </div>
          <div className="date-row" style={{  width: '700px',display: 'flex'}}>
           <div className="form-group1" style={{ flex: '0 0 45%', marginRight: '0px'  }}>
           <label>Rent</label>
              <input 
                type="text" 
                id="Rent" 
                value={product.price} 
                readOnly
                placeholder="₹ 00.00"
              />
           </div>
            <div className="form-group1" style={{ flex: '0 0 45%',marginLeft:"70px" }} >
              <label>Deposit</label>
             <input
              type="text"
              id="Deposite"
              value={product.deposit}
              readOnly
              placeholder='₹ 00.00'
             
             />
            </div>
          </div>
          <div className='total-quantity-display'>
            <p className='quantity-item1'>Total Quantity: {product.totalQuantity}</p>
            <p className='quantity-item2'>Booked Quantity: {product.totalQuantity - product.availableQuantity}</p>
          </div>

          <div className="product-image-container1">
            {product.imageUrl && ( // Change from productImageUrl to product.imageUrl
              <img src={product.imageUrl} alt="Product" className="product-image1" />
            )}
          </div>
         
          {products.length > 1 && index > 0 && (
                <FaTrash type="button" className='cancel-button' onClick={() => removeProductForm(index)}/>
              )}

          <button type="button" className='checkavailability' onClick={() => checkAvailability(index)}>Check Availability</button>
           
              
         

          <div className="available-quantity-display">
            {product.errorMessage ? (
              <span style={{ color: 'red' }}>{product.errorMessage}</span>
              
            ) : (
              product.availableQuantity !== null && (

                <p>Available Quantity: {product.availableQuantity}</p>
                

              )
            )}
          </div>
          
          
        </div>
      ))}
      <button className='checkavailability11' onClick={addProductForm}>Add New Product</button>
      
      
     </div>
      )}

      <button onClick={toggleAvailability1Form} className='availability1-toogle-button'>
          {isAvailability1FormVisible ? 'Create Bill' : 'Create Bill'}
      </button>
      
     
      { isAvailability1FormVisible &&  (
       
        <form onSubmit={handleBookingConfirmation}>
          <div className='customer-details-form'>
          <h9>Customer Details</h9>
         
          
          <div className="form-group1" style={{ marginTop: '80px' }} >
            <label>Name</label>
            <input
              type="text"
              value={userDetails.name}
              onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group1">
            <label>Email</label>
            <input
              type="email"
              value={userDetails.email}
              onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group1">
            <label>Contact</label>
            <input
              type="text"
              value={userDetails.contact}
              onChange={(e) => setUserDetails({ ...userDetails, contact: e.target.value })}
              required
            />
          </div>
          <div className="form-group1">
            <label>Assigned To</label>
            <input
              type="text"
              value={userDetails.assignedto}
              onChange={(e) => setUserDetails({ ...userDetails, assignedto: e.target.value })}
              required
            />
          </div>
          <div className="form-group1">
          <label>Stage</label>
          <select
            value={userDetails.stage}
            onChange={(e) => setUserDetails({ ...userDetails, stage: e.target.value })}
            required
          >
            <option value="Booking" >Booking</option>
            <option value="pickup">Pickup</option>
          </select>
        </div>
          <button type="submit" className='confirm-booking-button'>Confirm Booking</button>
          </div>
        </form>
      )}

          {receipt && (
            <div className="receipt-container">

              {receiptNumber && <h3>(Receipt No: {receiptNumber})</h3>}

              {/* Render the headings only once */}
              <div className="receipt-row">
                <div className="receipt-column">
                  <strong>Product Image</strong>
                </div>
                <div className="receipt-column">
                  <strong>Product Name</strong>
                </div>

                <div className="receipt-column">
                  <strong>Product Code</strong>
                </div>
                <div className="receipt-column">
                  <strong>Quantity</strong>
                </div>
                <div className="receipt-column">
                  <strong>Deposit</strong>
                </div>
                <div className="receipt-column">
                  <strong>Rent</strong>
                </div>
               
                
               
                <div className="receipt-column">
                  <strong>Total Price</strong>
                  
                </div>
                <div className="receipt-column">
                  <strong>Grand Total</strong>
                </div>
                <div className="receipt-column">
                  <strong>Action</strong>
                </div>
                
              </div>

              {/* Now map over products and display only the values */}
              {receipt.products.map((product, index) => (
                <div key={index} className="receipt-values">
                  <div className="receipt-column">
                    {product.productImageUrl && (
                      <img src={product.productImageUrl} alt="Product" style={{ width: '30px', height: '30px' }} />
                    )}
                  </div>
                  <div className="receipt-column">{product.productName}</div>
                  <div className="receipt-column">{product.productCode}</div>
                  <div className="receipt-column">{product.quantity}</div>
                  <div className="receipt-column">₹{product.deposit}</div>
                  <div className="receipt-column">₹{product.price}</div>
                  
                 
                  
                  <div className="receipt-column">₹{product.totalPrice}</div>
                  <div className="receipt-column">₹{product.grandTotal}</div>
                  <div className="receipt-column">
                  <FaTrash onClick={() => handleDeleteProduct(product.productCode)}
                  style={{ cursor: 'pointer', color: 'red' }} 
                  /> {/* Delete icon */}
                  </div>
                  
                </div>
              ))}
              <div className="receipt-row">
      <div className="receipt-column">
        <strong>Discount:</strong>
      </div>
      <div className="receipt-column">
        <input
          type="number"
          value={discount}
          onChange={handleDiscountChange}
          placeholder="Enter discount amount"
        />
      </div>
    </div>

    {/* Updated grand total */}
    <div className="receipt-row">
      <div className="receipt-column">
        <strong>Updated Grand Total:</strong>
      </div>
      <div className="receipt-column">₹{discountedGrandTotal}</div>
    </div>

              {!isPaymentConfirmed && (
                <button onClick={handleConfirmPayment} className='receiptconfirmpayment'>Confirm Payment</button>
              )}
              {isPaymentConfirmed && (
                <p className="success-message">Payment confirmed! Your booking has been saved.</p>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

export default Booking;