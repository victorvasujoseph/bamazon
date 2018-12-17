var inquirer = require("inquirer");
require('dotenv').config();
require("console.table");
var mysql = require("mysql");

var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

connection.connect(function (err) {
    if (err) throw err;
    selectAllProduct();
});

function selectAllProduct() {
    connection.query("select item_id, product_name, department_name, price from products", function (err, res) {
        if (err) throw err;
        console.log("\n");
        console.table(res);
        getCustomerOrder();
    });
}

function getCustomerOrder() {
    inquirer.prompt([
        {
            type: "input",
            name: "productId",
            message: "Enter the ID of the product you would like to buy?"
        },
        {
            type: "input",
            name: "units",
            message: "How many units would you like to buy?"
        }

    ]).then(function (arg) {
        connection.query("select * from products where item_id = ?", arg.productId, function (err, res) {
            if (err) throw err;

            if (arg.units <= res[0].stock_quantity) {
                var newQuantity = res[0].stock_quantity - arg.units;
                var sales = res[0].price * arg.units;

                var query = "UPDATE products SET ? WHERE ?";
                var values = [
                    {stock_quantity: newQuantity},
                    {item_id: arg.productId}
                ];
                connection.query(query, values, function (err) {
                    if (err) throw err;
                });
                var total = arg.units * res[0].price;
                console.log("Your order has been placed successfully. Your total cost is $" + total.toFixed(2));
                exit();
            } else {
                console.log("Insufficient quantity! Please try placing your order again later.");
                selectAllProduct();
            }
        });
    });
}

function exit() {
    inquirer.prompt([
        {
            type: "confirm",
            name: "menu",
            message: "Would you like to go back to the main menu?"
        }
    ]).then(function (arg) {
        if (arg.menu === false) {
            connection.end();
            process.exit();
        } else {
            getCustomerOrder();
        }
    });
}
