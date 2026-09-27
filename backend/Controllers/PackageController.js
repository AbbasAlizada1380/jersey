// Try importing Customer first, then Package
import Customer from "../Models/Customer.js";
import Package from "../Models/package.js";
import { Op } from "sequelize";
import nodemailer from "nodemailer";

export const getPackagesWithRemaining = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // default page 1
    const limit = 30;                           // 30 packages per page
    const offset = (page - 1) * limit;

    const { count, rows: packages } = await Package.findAndCountAll({
      where: {
        remain: {
          [Op.gt]: 0, // remaining > 0
        },
      },
      limit,
      offset,
      order: [["id", "DESC"]],
      include: [
        { model: Customer, as: "Sender" },
        { model: Customer, as: "Receiver" },
      ],
    });

    return res.status(200).json({
      totalPackages: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      packages,
    });

  } catch (error) {
    console.error("Get Packages With Remaining Error:", error);
    return res.status(500).json({ error: "Failed to get packages with remaining" });
  }
};


export const searchPackagesByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Search query 'name' is required",
        message: "Please provide a name to search for",
      });
    }

    const searchTerm = name.trim();
    console.log(`Searching for: ${searchTerm}`);

    // Search packages with sender OR receiver name matching (case-insensitive)
    const packages = await Package.findAll({
      include: [
        {
          association: "Sender",
          attributes: ["id", "name", "phoneNumber", "country"],
          required: false, // Always include sender if exists
        },
        {
          association: "Receiver",
          attributes: ["id", "name", "phoneNumber", "country"],
          required: false, // Always include receiver if exists
        },
      ],
      order: [["createdAt", "DESC"]], // Show newest first
    });

    // Filter packages where EITHER sender OR receiver name matches (case-insensitive)
    const filteredPackages = packages.filter(pkg => {
      // Check if package has sender and sender name matches
      const senderMatch = pkg.Sender &&
        pkg.Sender.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Check if package has receiver and receiver name matches
      const receiverMatch = pkg.Receiver &&
        pkg.Receiver.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Include package if either sender OR receiver matches
      return senderMatch || receiverMatch;
    });

    // If no matches found, suggest similar names
    if (filteredPackages.length === 0) {
      // Collect all unique sender and receiver names for suggestions
      const allNames = new Set();
      packages.forEach(pkg => {
        if (pkg.Sender) allNames.add(pkg.Sender.name);
        if (pkg.Receiver) allNames.add(pkg.Receiver.name);
      });

      // Find similar names (partial matches)
      const suggestions = Array.from(allNames).filter(fullName =>
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        searchTerm.toLowerCase().includes(fullName.toLowerCase().substring(0, 3))
      ).slice(0, 5); // Limit to 5 suggestions

      return res.status(200).json({
        success: true,
        message: `No packages found matching '${searchTerm}'`,
        totalRecords: 0,
        data: [],
        suggestions: suggestions.length > 0 ? suggestions : null,
        searchTerm: searchTerm,
      });
    }

    // Enhance results with match type information
    const enhancedPackages = filteredPackages.map(pkg => {
      const senderMatch = pkg.Sender &&
        pkg.Sender.name.toLowerCase().includes(searchTerm.toLowerCase());
      const receiverMatch = pkg.Receiver &&
        pkg.Receiver.name.toLowerCase().includes(searchTerm.toLowerCase());

      return {
        ...pkg.toJSON(),
        matchInfo: {
          matchesSender: senderMatch,
          matchesReceiver: receiverMatch,
          matchType: senderMatch && receiverMatch ? "both" :
            senderMatch ? "sender" : "receiver",
          highlightedName: searchTerm
        }
      };
    });

    // Count matches by type
    const senderMatches = enhancedPackages.filter(p => p.matchInfo.matchesSender).length;
    const receiverMatches = enhancedPackages.filter(p => p.matchInfo.matchesReceiver).length;
    const bothMatches = enhancedPackages.filter(p => p.matchInfo.matchType === "both").length;

    return res.status(200).json({
      success: true,
      message: `Found ${filteredPackages.length} package(s) matching '${searchTerm}'`,
      totalRecords: filteredPackages.length,
      searchTerm: searchTerm,
      matchStats: {
        senderMatches,
        receiverMatches,
        bothMatches,
        uniquePackages: filteredPackages.length
      },
      data: enhancedPackages,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Search Packages Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to search packages",
      message: "An internal server error occurred",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
    });
  }
};

export const getPackagesByRange = async (req, res) => {
  try {
    const { startDate, endDate, transitWay } = req.query;

    if (!startDate || !endDate || !transitWay) {
      return res.status(400).json({
        error: "Missing required query parameters: startDate, endDate, transitWay",
      });
    }

    // You can also try a simpler query first to debug
    const packages = await Package.findAll({
      where: {
        transitWay,
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      },
      include: [
        {
          association: "Sender", // Use association name instead of model
          attributes: ["id", "name", "phoneNumber", "country"]
        },
        {
          association: "Receiver", // Use association name instead of model
          attributes: ["id", "name", "phoneNumber", "country"]
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      message: "Successfully retrieved filtered packages",
      totalRecords: packages.length,
      data: packages,
    });

  } catch (error) {
    console.error("Get Packages By Range Error:", error);
    return res.status(500).json({
      error: "Failed to retrieve packages",
      details: error.message
    });
  }
};

// In sendCustomerNotification function, change this:
const sendCustomerNotification = async (email, subject, message, packageData = null) => {
  try {
    if (!email) {
      console.log('No email address provided for customer notification');
      return;
    }

    // Add this line to get EMAIL_CONFIG
    const EMAIL_CONFIG = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    };

    // ... rest of the function
    const htmlContent = packageData ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
          ${subject}
        </h2>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="font-size: 16px; color: #555;">${message}</p>
          
          <div style="margin-top: 20px;">
            <h3 style="color: #444;">Package Details:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Package ID:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${packageData.id || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Tracking Number:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${packageData.track_number || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Current Status:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                  <strong style="color: #2196F3;">${packageData.location || 'N/A'}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Sender:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                  ${packageData.Sender?.name || 'N/A'}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Receiver:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                  ${packageData.Receiver?.name || 'N/A'}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Weight:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${packageData.totalWeight || 0} kg</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Transit Method:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${'your Cargo' || 'N/A'}</td>
              </tr>
              <tr>
              </tr>
            </table>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #e8f4fd; border-radius: 5px;">
            <h4 style="color: #1565C0; margin-top: 0;">Tracking Information:</h4>
            <p style="margin: 5px 0;">You can track your package using:</p>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li>Package ID: <strong>${packageData.id}</strong></li>
              <li>Tracking Number: <strong>${packageData.track_number || 'N/A'}</strong></li>
            </ul>
          </div>
        </div>
        <p style="color: #777; font-size: 12px; margin-top: 30px;">
          This is an automated notification from Package Management System.<br>
          Please do not reply to this email.
        </p>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="color: #333;">${subject}</h2>
        <p>${message}</p>
      </div>
    `;

    const mailOptions = {
      from: `"Package Tracking System" <${EMAIL_CONFIG.auth.user}>`,
      to: email,
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`Customer notification sent to: ${email}`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
  }
};

export const updatePackageLocation = async (req, res) => {
  try {
    const { id } = req.params; // Can be single or multiple IDs "1,2,4"
    const { location } = req.body;

    if (!location) {
      return res.status(400).json({
        error: "location field is required",
      });
    }

    // Split IDs by comma and convert to numbers
    const ids = id.split(",").map(i => parseInt(i)).filter(i => !isNaN(i));

    if (ids.length === 0) {
      return res.status(400).json({
        error: "No valid package IDs provided",
      });
    }

    // Get packages before update to know old locations
    const packagesBeforeUpdate = await Package.findAll({
      where: { id: ids },
      include: [
        {
          model: Customer,
          as: "Sender",
          attributes: ["id", "name", "phoneNumber", "country", "email"]
        },
        {
          model: Customer,
          as: "Receiver",
          attributes: ["id", "name", "phoneNumber", "country", "email"]
        }
      ]
    });

    if (packagesBeforeUpdate.length === 0) {
      return res.status(404).json({
        error: "No packages found for the provided IDs",
      });
    }

    // Update all packages matching these IDs
    const [updatedCount] = await Package.update(
      { location },
      {
        where: { id: ids }
      }
    );

    // Get updated packages with complete data
    const updatedPackages = await Package.findAll({
      where: { id: ids },
      include: [
        {
          model: Customer,
          as: "Sender",
          attributes: ["id", "name", "phoneNumber", "country", "email"]
        },
        {
          model: Customer,
          as: "Receiver",
          attributes: ["id", "name", "phoneNumber", "country", "email"]
        }
      ]
    });

    // Send email notifications for each package
    for (const pkg of updatedPackages) {
      // Find the old location from before update
      const oldPackage = packagesBeforeUpdate.find(p => p.id === pkg.id);
      const oldLocation = oldPackage ? oldPackage.location : 'Unknown';

      // Create package data for email
      const packageData = {
        id: pkg.id,
        Sender: pkg.Sender,
        Receiver: pkg.Receiver,
        ...pkg.toJSON()
      };

      // Send email to admin (original notification)
      await sendPackageNotification(
        "📍 Package Location Updated",
        `Package location has been updated to:<br>
      <strong>${location}</strong>`,
        packageData
      );

      // Send email to SENDER if email exists
      if (pkg.Sender?.email) {
        await sendCustomerNotification(
          pkg.Sender.email,
          `📦 Package Status Update - Package #${pkg.id}`,
          `Your package has been moved to a new location:<br>
           <strong>New Status:</strong> ${location}<br><br>
           The package is on its way to the destination.`,
          packageData
        );
      }

      // Send email to RECEIVER if email exists
      if (pkg.Receiver?.email) {
        await sendCustomerNotification(
          pkg.Receiver.email,
          `📦 Your Package Status Update - Package #${pkg.id}`,
          `The package sent to you has been moved to a new location:<br>
           <strong>Current Status:</strong> ${location}<br><br>
           The package is on its way to you.`,
          packageData
        );
      }
    }

    // If updating multiple packages, send a summary email to admin
    if (updatedPackages.length > 1) {
      const packageIds = updatedPackages.map(p => p.id).join(', ');
      const packageNames = updatedPackages.map(p =>
        `${p.id} (${p.Receiver?.name || 'Unknown'})`
      ).join('<br>');

      await sendPackageNotification(
        `📍 ${updatedPackages.length} Package Locations Updated`,
        `<strong>${updatedPackages.length} packages</strong> have been updated to new location:<br>
         <strong>New Location:</strong> ${location}<br><br>
         <strong>Updated Packages:</strong><br>
         ${packageNames}<br><br>
         <strong>Package IDs:</strong> ${packageIds}`,
        null
      );

      // Count email notifications sent
      const senderEmailsSent = updatedPackages.filter(p => p.Sender?.email).length;
      const receiverEmailsSent = updatedPackages.filter(p => p.Receiver?.email).length;

      return res.status(200).json({
        message: `Successfully updated location for ${updatedCount} package(s)`,
        data: updatedPackages,
        notifications: {
          adminEmailsSent: 1 + (updatedPackages.length > 1 ? 1 : 0), // One per package + summary
          senderEmailsSent,
          receiverEmailsSent,
          totalCustomerEmails: senderEmailsSent + receiverEmailsSent
        },
        details: {
          oldLocations: packagesBeforeUpdate.map(p => ({
            id: p.id,
            oldLocation: p.location
          })),
          newLocation: location,
          timestamp: new Date().toISOString()
        }
      });
    }

    // For single package update
    const senderEmailSent = updatedPackages[0]?.Sender?.email ? 1 : 0;
    const receiverEmailSent = updatedPackages[0]?.Receiver?.email ? 1 : 0;

    return res.status(200).json({
      message: `Successfully updated location for ${updatedCount} package(s)`,
      data: updatedPackages,
      notifications: {
        adminEmailsSent: 1,
        senderEmailsSent: senderEmailSent,
        receiverEmailsSent: receiverEmailSent,
        totalCustomerEmails: senderEmailSent + receiverEmailSent
      },
      details: {
        oldLocations: packagesBeforeUpdate.map(p => ({
          id: p.id,
          oldLocation: p.location
        })),
        newLocation: location,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Update Package Location Error:", error);
    return res.status(500).json({
      error: "Failed to update package location",
      details: error.message,
    });
  }
};


export const getAllTransitWays = async (req, res) => {
  try {
    // Fetch only transitWay column
    const packages = await Package.findAll({
      attributes: ["transitWay"],
    });

    // Extract values & filter unique ones
    const allTransitWays = packages.map((p) => p.transitWay);
    const uniqueTransitWays = [...new Set(allTransitWays)];

    return res.status(200).json({
      message: "Successfully retrieved all transit ways",
      data: uniqueTransitWays,
    });
  } catch (error) {
    console.error("Get All Transit Ways Error:", error);
    return res.status(500).json({ error: "Failed to retrieve transit ways" });
  }
};


/* ============================================================
   GET ALL PACKAGES
============================================================ */
export const getAllPackages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;  // default page 1
    const limit = 30;                            // 30 packages per page
    const offset = (page - 1) * limit;

    const { count, rows: packages } = await Package.findAndCountAll({
      limit,
      offset,
      order: [["id", "DESC"]], // newest first (optional)
      include: [
        { model: Customer, as: "Sender" },
        { model: Customer, as: "Receiver" },
      ],
    });

    return res.status(200).json({
      totalPackages: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      packages,
    });

  } catch (error) {
    console.error("Get All Packages Error:", error);
    return res.status(500).json({ error: "Failed to get packages" });
  }
};


/* ============================================================
   GET PACKAGE BY ID
============================================================ */
export const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    const pkg = await Package.findByPk(id, {
      include: [
        { model: Customer, as: "Sender" },
        { model: Customer, as: "Receiver" },
      ],
    });

    if (!pkg) return res.status(404).json({ error: "Package not found" });

    return res.status(200).json(pkg);
  } catch (error) {
    console.error("Get Package Error:", error);
    return res.status(500).json({ error: "Failed to get package" });
  }
};

// Email configuration - set these in your environment variables or here
const EMAIL_CONFIG = {
  service: 'gmail', // or use your email service
  auth: {
    user: process.env.EMAIL || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
};

// Recipient email for notifications
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'admin@example.com';

// Create email transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Helper function to send email notifications
const sendPackageNotification = async (subject, message, packageData = null) => {
  try {
    const htmlContent = packageData ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
          ${subject}
        </h2>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="font-size: 16px; color: #555;">${message}</p>
          
          ${packageData ? `
          <div style="margin-top: 20px;">
            <h3 style="color: #444;">Package Details:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Package ID:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${packageData.id || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Sender:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                  ${packageData.Sender?.name || 'N/A'}<br>
                  <small>Phone: ${packageData.Sender?.phoneNumber || 'N/A'}</small><br>
                  <small>Country: ${packageData.Sender?.country || 'N/A'}</small>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Receiver:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                  ${packageData.Receiver?.name || 'N/A'}<br>
                  <small>Phone: ${packageData.Receiver?.phoneNumber || 'N/A'}</small><br>
                  <small>Country: ${packageData.Receiver?.country || 'N/A'}</small>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Weight:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${packageData.totalWeight || 0} kg</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Pieces:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${packageData.piece || 0}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Value:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">$${packageData.value || 0}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Transit Way:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${'your Cargo' || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Total Cash:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">$${packageData.totalCash || 0}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${packageData.location || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Tracking #:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${packageData.track_number || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(packageData.date || packageData.createdAt).toLocaleDateString()}</td>
              </tr>
            </table>
          </div>
          ` : ''}
        </div>
        <p style="color: #777; font-size: 12px; margin-top: 30px;">
          This is an automated notification from Package Management System.
        </p>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="color: #333;">${subject}</h2>
        <p>${message}</p>
      </div>
    `;

    const mailOptions = {
      from: `"Package Management System" <${EMAIL_CONFIG.auth.user}>`,
      to: NOTIFICATION_EMAIL,
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email notification sent: ${subject}`);
  } catch (error) {
    console.error('Error sending email notification:', error);
    // Don't throw the error to avoid breaking the main operation
    // Just log it and continue
  }
};
/* ============================================================
   CREATE PACKAGE + SENDER + RECEIVER + EMAILS
============================================================ */
export const createPackage = async (req, res) => {
  try {
    const { sender, receiver, packageData } = req.body;

    if (!sender || !receiver || !packageData) {
      return res.status(400).json({
        error: "sender, receiver and packageData are required",
      });
    }

    // 1️⃣ Create sender
    const newSender = await Customer.create(sender);

    // 2️⃣ Create receiver
    const newReceiver = await Customer.create(receiver);

    // 3️⃣ Create package - FIXED: use packageData.idDocument and packageData.idDocumentMetadata
    const newPackage = await Package.create({
      sender: newSender.id,
      receiver: newReceiver.id,
      location: "your Cargo Stock",
      idDocument: packageData.idDocument || null,
      idDocumentMetadata: packageData.idDocumentMetadata || {},
      ...packageData,
    });
        // 4️⃣ Generate formatted ID using the newly created ID
    const formattedPackageId = `AC${newPackage.id.toString().padStart(6, '0')}`;

    // 5️⃣ Update the package with formatted ID
    await newPackage.update({ formattedId: formattedPackageId });

    // Prepare full package data for emails
    const packageEmailData = {
      id: newPackage.id,
      formattedId: formattedPackageId,
      Sender: newSender,
      Receiver: newReceiver,
      ...newPackage.toJSON(),
    };
    /* ==========================
       📧 ADMIN EMAIL
    ========================== */
    await sendPackageNotification(
      "📦 New Package Created",
      `A new package has been successfully created in the system.`,
      packageEmailData
    );

    /* ==========================
       📧 SENDER EMAIL
    ========================== */
    if (newSender.email) {
      await sendCustomerNotification(
        newSender.email,
        `📦 Your Package Has Been Registered (#${newPackage.id})`,
        `Your package has been successfully registered and is currently at:<br>
         <strong>${newPackage.location}</strong><br><br>
         You will be notified when the status changes.`,
        packageEmailData
      );
    }

    /* ==========================
       📧 RECEIVER EMAIL
    ========================== */
    if (newReceiver.email) {
      await sendCustomerNotification(
        newReceiver.email,
        `📦 A Package Is On The Way To You (#${newPackage.id})`,
        `A package has been sent to you and is currently at:<br>
         <strong>${newPackage.location}</strong><br><br>
         You will receive updates as the package moves.`,
        packageEmailData
      );
    }

    return res.status(201).json({
      message: "Package, sender, and receiver created successfully",
      data: {
        sender: newSender,
        receiver: newReceiver,
        package: newPackage,
      },
      notifications: {
        adminEmailSent: true,
        senderEmailSent: !!newSender.email,
        receiverEmailSent: !!newReceiver.email,
      },
    });

  } catch (error) {
    console.error("Create Package Error:", error);
    return res.status(500).json({
      error: "Failed to create package",
      details: error.message,
    });
  }
};


/* ============================================================
   UPDATE PACKAGE + OPTIONAL SENDER/RECEIVER
============================================================ */
export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { sender, receiver, packageData, idDocument, idDocumentMetadata } = req.body; // Add these


    const pkg = await Package.findByPk(id, {
      include: [
        { model: Customer, as: "Sender" },
        { model: Customer, as: "Receiver" },
      ],
    });

    if (!pkg) return res.status(404).json({ error: "Package not found" });

    // Store old data for comparison
    const oldPackageData = {
      totalWeight: pkg.totalWeight,
      transitWay: pkg.transitWay,
      totalCash: pkg.totalCash,
      location: pkg.location,
      senderName: pkg.Sender?.name,
      receiverName: pkg.Receiver?.name
    };

    // 1️⃣ Update sender if provided
    if (sender && pkg.Sender) {
      await Customer.update(sender, { where: { id: pkg.sender } });
    }

    // 2️⃣ Update receiver if provided
    if (receiver && pkg.Receiver) {
      await Customer.update(receiver, { where: { id: pkg.receiver } });
    }

    // 3️⃣ Update package data
    if (packageData || idDocument || idDocumentMetadata) {
      const updateData = {
        ...packageData,
        ...(idDocument !== undefined && { idDocument }),
        ...(idDocumentMetadata !== undefined && { idDocumentMetadata })
      };
      await pkg.update(updateData);
    }

    // Refresh to get updated data
    await pkg.reload({
      include: [
        { model: Customer, as: "Sender" },
        { model: Customer, as: "Receiver" },
      ],
    });

    // Send email notification
    const changes = [];
    if (packageData?.totalWeight !== undefined && packageData.totalWeight !== oldPackageData.totalWeight) {
      changes.push(`Weight: ${oldPackageData.totalWeight} → ${packageData.totalWeight} kg`);
    }
    if (packageData?.transitWay && packageData.transitWay !== oldPackageData.transitWay) {
      changes.push(`Transit: ${oldPackageData.transitWay} → ${packageData.transitWay}`);
    }
    if (packageData?.totalCash !== undefined && packageData.totalCash !== oldPackageData.totalCash) {
      changes.push(`Total: $${oldPackageData.totalCash} → $${packageData.totalCash}`);
    }
    if (packageData?.location && packageData.location !== oldPackageData.location) {
      changes.push(`Location: ${oldPackageData.location} → ${packageData.location}`);
    }

    const changeMessage = changes.length > 0
      ? `Changes made: ${changes.join(', ')}`
      : 'Package details updated';

    await sendPackageNotification(
      "✏️ Package Updated Successfully",
      `${changeMessage}`,
      {
        id: pkg.id,
        Sender: pkg.Sender, // Complete sender object
        Receiver: pkg.Receiver, // Complete receiver object
        ...pkg.toJSON()
      }
    );

    return res.status(200).json({
      message: "Package updated successfully",
      data: pkg
    });
  } catch (error) {
    console.error("Update Package Error:", error);
    return res.status(500).json({ error: "Failed to update package" });
  }
};

/* ============================================================
   DELETE PACKAGE + OPTIONAL CUSTOMERS
============================================================ */
export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const pkg = await Package.findByPk(id, {
      include: [
        { model: Customer, as: "Sender" },
        { model: Customer, as: "Receiver" },
      ],
    });

    if (!pkg) return res.status(404).json({ error: "Package not found" });

    // Store data for notification before deletion
    const packageInfo = {
      id: pkg.id,
      Sender: pkg.Sender, // Complete sender object
      Receiver: pkg.Receiver, // Complete receiver object
      ...pkg.toJSON()
    };

    // Only delete package
    await pkg.destroy();

    // Send email notification
    await sendPackageNotification(
      "🗑️ Package Deleted Successfully",
      `Package #${packageInfo.id} has been deleted from the system.<br>
       Deletion Time: ${new Date().toLocaleString()}`,
      packageInfo
    );

    return res.status(200).json({
      message: "Package deleted successfully",
      deletedPackage: packageInfo
    });
  } catch (error) {
    console.error("Delete Package Error:", error);
    return res.status(500).json({ error: "Failed to delete package" });
  }
};


export const updatePackageTracking = async (req, res) => {
  try {
    const { id } = req.params; // Can be single ID or multiple IDs "1,2,4"
    const { track_number } = req.body;

    if (!track_number || track_number.trim() === "") {
      return res.status(400).json({
        error: "track_number field is required and cannot be empty",
      });
    }

    const cleanTrackNumber = track_number.trim();

    // Split IDs by comma and convert to numbers
    const ids = id.split(",").map(i => parseInt(i)).filter(i => !isNaN(i));

    if (ids.length === 0) {
      return res.status(400).json({
        error: "No valid package IDs provided",
      });
    }

    // Get packages before update to know old tracking numbers
    const packagesBeforeUpdate = await Package.findAll({
      where: { id: ids },
      include: [
        {
          model: Customer,
          as: "Sender",
          attributes: ["id", "name", "phoneNumber", "country", "email"]
        },
        {
          model: Customer,
          as: "Receiver",
          attributes: ["id", "name", "phoneNumber", "country", "email"]
        }
      ]
    });

    if (packagesBeforeUpdate.length === 0) {
      return res.status(404).json({
        error: "No packages found for the provided IDs",
      });
    }

    // Update all packages matching these IDs
    const [updatedCount] = await Package.update(
      { track_number: cleanTrackNumber },
      {
        where: { id: ids }
      }
    );

    // Get updated packages with complete data
    const updatedPackages = await Package.findAll({
      where: { id: ids },
      include: [
        {
          model: Customer,
          as: "Sender",
          attributes: ["id", "name", "phoneNumber", "country", "email"]
        },
        {
          model: Customer,
          as: "Receiver",
          attributes: ["id", "name", "phoneNumber", "country", "email"]
        }
      ]
    });

    // Send email notifications for each package
    const emailPromises = [];

    for (const pkg of updatedPackages) {
      // Find the old tracking number from before update
      const oldPackage = packagesBeforeUpdate.find(p => p.id === pkg.id);
      const oldTrackNumber = oldPackage ? oldPackage.track_number || 'Not Set' : 'Not Set';

      // Create package data for email
      const packageData = {
        id: pkg.id,
        Sender: pkg.Sender,
        Receiver: pkg.Receiver,
        ...pkg.toJSON()
      };

      // Send email to admin (original notification)
      emailPromises.push(
        sendPackageNotification(
          "📮 Package Tracking Number Updated",
          `Package tracking number has been updated:<br>
           <strong>${oldTrackNumber}</strong> → <strong>${cleanTrackNumber}</strong>`,
          packageData
        )
      );

      // Send email to SENDER if email exists
      if (pkg.Sender?.email) {
        emailPromises.push(
          sendCustomerNotification(
            pkg.Sender.email,
            `📦 Tracking Number Assigned - Package #${pkg.id}`,
            `Your package now has a tracking number:<br>
             <strong>New Tracking Number:</strong> ${cleanTrackNumber}<br><br>
             You can use this number to track your package's progress.`,
            packageData
          )
        );
      }

      // Send email to RECEIVER if email exists
      if (pkg.Receiver?.email) {
        emailPromises.push(
          sendCustomerNotification(
            pkg.Receiver.email,
            `📦 Tracking Number Assigned - Your Package #${pkg.id}`,
            `The package sent to you now has a tracking number:<br>
             <strong>Tracking Number:</strong> ${cleanTrackNumber}<br><br>
             You can use this number to track the package's delivery progress.`,
            packageData
          )
        );
      }
    }

    // Wait for all emails to be sent
    await Promise.allSettled(emailPromises);

    // Count successful email notifications
    const emailResults = await Promise.allSettled(emailPromises);
    const successfulEmails = emailResults.filter(result => result.status === 'fulfilled').length;
    const failedEmails = emailResults.filter(result => result.status === 'rejected').length;

    // If updating multiple packages, send a summary email to admin
    if (updatedPackages.length > 1) {
      const packageIds = updatedPackages.map(p => p.id).join(', ');
      const packageNames = updatedPackages.map(p =>
        `${p.id} (${p.Receiver?.name || 'Unknown'})`
      ).join('<br>');

      await sendPackageNotification(
        `📮 ${updatedPackages.length} Package Tracking Numbers Updated`,
        `<strong>${updatedPackages.length} packages</strong> have been assigned a new tracking number:<br>
         <strong>New Tracking Number:</strong> ${cleanTrackNumber}<br><br>
         <strong>Updated Packages:</strong><br>
         ${packageNames}<br><br>
         <strong>Package IDs:</strong> ${packageIds}`,
        null
      );
    }

    // Calculate email statistics
    const senderEmailsSent = updatedPackages.filter(p => p.Sender?.email).length;
    const receiverEmailsSent = updatedPackages.filter(p => p.Receiver?.email).length;
    const summaryEmailSent = updatedPackages.length > 1 ? 1 : 0;
    const totalAdminEmails = updatedPackages.length + summaryEmailSent;

    return res.status(200).json({
      success: true,
      message: `Successfully updated tracking number for ${updatedCount} package(s)`,
      data: updatedPackages.map(pkg => ({
        id: pkg.id,
        track_number: pkg.track_number,
        sender: pkg.Sender?.name,
        receiver: pkg.Receiver?.name,
        status: pkg.location
      })),
      tracking_info: {
        new_tracking_number: cleanTrackNumber,
        packages_updated: updatedPackages.length
      },
      notifications: {
        adminEmailsSent: totalAdminEmails,
        senderEmailsSent,
        receiverEmailsSent,
        totalCustomerEmails: senderEmailsSent + receiverEmailsSent,
        email_delivery: {
          attempted: emailPromises.length,
          successful: successfulEmails,
          failed: failedEmails
        }
      },
      details: {
        old_tracking_numbers: packagesBeforeUpdate.map(p => ({
          id: p.id,
          old_track_number: p.track_number || 'Not Set'
        })),
        new_track_number: cleanTrackNumber,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Update Package Tracking Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update package tracking number",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
export const closePackageRemaining = async (req, res) => {
  try {
    const { id } = req.params;

    const pkg = await Package.findByPk(id, {
      include: [
        { model: Customer, as: "Sender" },
        { model: Customer, as: "Receiver" },
      ],
    });

    if (!pkg) {
      return res.status(404).json({ error: "Package not found" });
    }

    // Update financial status - FIX HERE
    pkg.remain = 0;
    pkg.received = pkg.totalCash || 0; // Use received, not receivedCash

    await pkg.save();

    // Store data for notification
    const packageInfo = {
      id: pkg.id,
      Sender: pkg.Sender,
      Receiver: pkg.Receiver,
      ...pkg.toJSON(),
    };

    // Send email notification - FIX THE TEMPLATE
    await sendPackageNotification(
      "✅ Package Payment Completed",
      `
      Package #${pkg.id} has been fully settled.<br/>
      Total Cash: $${pkg.totalCash || 0}<br/>
      Received Cash: $${pkg.received || 0}<br/>
      Remaining: $${pkg.remain || 0}<br/>
      Completion Time: ${new Date().toLocaleString()}
      `,
      packageInfo
    );

    return res.status(200).json({
      message: "Package remaining cleared and payment completed",
      package: packageInfo,
    });

  } catch (error) {
    console.error("Close Package Remaining Error:", error);
    return res.status(500).json({ error: "Failed to close package remaining" });
  }
};

export const getPackagesByRunQuery = async (req, res) => {
  try {
    const { run } = req.query;

    if (!run || isNaN(parseInt(run))) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid run number as query parameter",
      });
    }

    const runNumber = parseInt(run);

    const packages = await Package.findAll({
      where: {
        run: runNumber,
      },
      include: [
        {
          model: Customer,
          as: "Sender",
        },
        {
          model: Customer,
          as: "Receiver",
        },
      ],
    });

    return res.status(200).json({
      success: true,
      count: packages.length,
      data: packages,
    });
  } catch (error) {
    console.error("Error fetching packages by run query:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
export const updatePackageIdDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { idDocument, idDocumentMetadata } = req.body;

    const pkg = await Package.findByPk(id);
    if (!pkg) {
      return res.status(404).json({ error: "Package not found" });
    }

    await pkg.update({
      idDocument,
      idDocumentMetadata
    });

    // Send notification
    await sendPackageNotification(
      "📄 Package ID Document Updated",
      `ID document has been ${idDocument ? 'updated' : 'removed'} for Package #${id}`,
      pkg
    );

    return res.status(200).json({
      message: "Package ID document updated successfully",
      data: pkg
    });
  } catch (error) {
    console.error("Update ID Document Error:", error);
    return res.status(500).json({ error: "Failed to update ID document" });
  }
};
// Export if needed
export { sendPackageNotification }; 