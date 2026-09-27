
// A package belongs to one sender and one receiver (both from Customer table)
import Customer from "./Customer.js";
import Package from "./package.js";

await sequelize.sync({ alter: true });
