To run backend server 
go to path web>backend
then Run "npx nodemon src/index.js"
backend server will run under
    http://localhost:3000


| Feature                 | Method | Endpoint                                |
| ----------------------- | ------ | --------------------------------------- |
| Register                | POST   | `/api/auth/register`                    |
| Login                   | POST   | `/api/auth/login`                       |
| Get my profile          | GET    | `/api/users/me`                         |
| Update profile          | PATCH  | `/api/users/me`                         |
| Get my interests        | GET    | `/api/users/me/bio`                     |
| Update interests        | PATCH  | `/api/users/me/bio`                     |
| Send connection request | POST   | `/api/connections/request/:recipientId` |
| Accept request          | POST   | `/api/connections/accept/:requesterId`  |
| Reject request          | POST   | `/api/connections/reject/:requesterId`  |
| Get my connections      | GET    | `/api/connections/my`                   |
| Get recommendations     | GET    | `/api/recommendations`                  |


These Endpoint Must work now