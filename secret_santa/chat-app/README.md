# Chat App

This project is a real-time chat application built with Node.js, Express, and Socket.IO. It supports user authentication, room creation and joining, group and individual chat, anonymous chat, and dare assignments with clue-based interactions.

## Features

- User authentication (registration and login)
- Create and join chat rooms
- Group and individual chat functionality
- Anonymous chat options
- Dare assignments with interactive clues

## Project Structure

```
chat-app
├── src
│   ├── app.js                # Initializes the Express application and Socket.IO
│   ├── server.js             # Entry point for the server
│   ├── config
│   │   └── db.js            # Database connection logic
│   ├── controllers
│   │   ├── authController.js # User authentication functions
│   │   ├── chatController.js # Chat message handling functions
│   │   ├── roomController.js # Chat room management functions
│   │   └── dareController.js # Dare assignments and clue management
│   ├── models
│   │   ├── User.js           # User model
│   │   ├── ChatRoom.js       # Chat room model
│   │   ├── Message.js        # Message model
│   │   └── Dare.js           # Dare model
│   ├── routes
│   │   ├── auth.js           # Routes for user authentication
│   │   ├── chat.js           # Routes for chat functionalities
│   │   ├── room.js           # Routes for room management
│   │   └── dare.js           # Routes for dare assignments
│   ├── middleware
│   │   └── authMiddleware.js  # Middleware for route protection
│   ├── socket
│   │   └── index.js          # Socket.IO event handling
│   └── utils
│       └── clueUtils.js      # Utility functions for clues
├── package.json               # npm configuration file
├── .env                       # Environment variables
└── README.md                  # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd chat-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your environment variables in the `.env` file. You can use the `.env.example` as a reference.

4. Start the server:
   ```
   npm start
   ```

## Usage

- Navigate to `http://localhost:3000` in your browser to access the chat application.
- Follow the on-screen instructions to register, log in, and start chatting.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.