# Chatroom Backend

This project is a real-time chat application built with Node.js, Express, and Socket.IO. It supports user authentication, group and individual chat functionalities, anonymous chat, dare assignments, and clue-based interactions.

## Features

- **User Authentication**: Users can register and log in to the application.
- **Real-time Chat**: Supports both group and individual chat functionalities using Socket.IO.
- **Anonymous Chat**: Users can engage in anonymous conversations.
- **Dare Assignments**: Users can create and assign dares to each other.
- **Clue-based Interactions**: Users can interact with clues related to dares.

## Folder Structure

```
chatroom-backend
├── src
│   ├── app.js
│   ├── controllers
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   └── dareController.js
│   ├── routes
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   └── dareRoutes.js
│   ├── models
│   │   ├── user.js
│   │   ├── room.js
│   │   └── dare.js
│   ├── utils
│   │   └── clueUtils.js
│   └── socket
│       └── index.js
├── package.json
├── .env
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd chatroom-backend
   ```
3. Install the dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory and add your environment variables (e.g., database connection strings, secret keys).

## Usage

1. Start the server:
   ```
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000` (or the port specified in your app).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.