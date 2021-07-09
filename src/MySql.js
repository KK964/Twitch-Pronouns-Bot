const mysql = require('mysql');
const fs = require('fs');
const { promisify } = require('util');

module.exports = class MySql {
  constructor() {
    this.connection = mysql.createConnection({
      host: process.env.HOST,
      user: process.env.USER,
      password: process.env.PASSWORD,
      multipleStatements: true,
      bigNumberStrings: true,
    });

    this.connection.connect((err) => {
      if (err) {
        console.log(err);
      } else {
        console.log('MySQL connection established');
      }
    });

    this.init();
  }

  query(query, params) {
    return new Promise((resolve, reject) => {
      this.connection.query(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async init() {
    var sql = await promisify(fs.readFile)('../../init.sql', 'utf8');
    this.query(sql).catch((err) => {
      console.log(err);
    });
  }

  close() {
    this.connection.end();
  }

  getConnection() {
    return this.connection;
  }
};
