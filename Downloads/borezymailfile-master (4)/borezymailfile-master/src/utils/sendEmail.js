// src/utils/sendEmail.js
import emailjs from 'emailjs-com';

// Function to send email using EmailJS
export const sendEmail = async (ownerEmail, password, ownerName, startDate, endDate, amount) => {
  // Define the template parameters with the recipient's email and message details
  const templateParams = {
    to_email: ownerEmail, // Recipient's email address
    username: ownerEmail, // Email as the username
    password: password, // User password
    ownerName: ownerName, // Name of the owner
    startDate: startDate, // Subscription start date
    endDate: endDate, // Subscription end date
    amount: amount // Subscription amount
  };

  try {
    // Send the email using EmailJS
    await emailjs.send('service_9lslyi2', 'template_2t7erac', templateParams, '14_ths1xYdpFcvGAU');
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};
