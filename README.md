# Robo Store

Robo store is a FAKE online shopping site for purchasing robots.
The purpose of the project is mainly to practice developing skills of frontend and backend development, using React and Node.js.

GitHub: https://github.com/Ori-Sason/robo-store-frontend, https://github.com/Ori-Sason/robo-store-backend
Heroku: https://robo-store.herokuapp.com/#/


## Tech Stack

**Client:** React (including Web Sockets and PWA), Redux, SASS.

**Server:** Node, Express, MongoDB/SQL (check point below).

- The backend support MongoDB and SQL. In order to switch between the two: comment-uncomment the top lines at:
  1. api/*/*.controller.js
  2. api/auth/auth.service.js
  3. services.socket.js
  At the moment, on production I used MongoDB database.

## Features

- Full CRUD operations over robots, users and reviews.
- User authentication.
- Admin priorities, such as updating or deleting users and making users as admins.
- Backend sorting, filtering and pagination.
- Live chat room using Web Sockets.
- Dashboard page showing site statistics (using react-chart.js-2).
- Google Maps API.
- PWA option for installing on laptop or mobile.


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`SECRET1` - Secret key for encrypting login passwords.

`MONGODB_URI` - URI to Mongodb server.


## 🚀 About Me

I'm a full stack developer who just finish 4 months of bootcamp.

Started as a CPA in an audit department in PwC Israel and continued to a full-time job as a self-educated developer of automated tools for the different departments in the firm (mainly used VBA, C# and Google Scripts).

Now looking to do my next step as a full stack developer :)


## 🔗 Links

[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ori-sason-cpa-318062229/)

Also checkout my course final Project - Wixy - website builder, inspired by Wix:
- GitHub: https://github.com/wixy2022/wixy-frontend, https://github.com/wixy2022/wixy-backend
- Heroku: https://wixy-2022.herokuapp.com/#/

The final project was created with my 2 team mates:
- Alex Yakovlev - https://www.linkedin.com/in/alex-yakovlev/ & https://github.com/AlexYakovlevCa
- Vicky Polatov - https://github.com/Vicky-PM
