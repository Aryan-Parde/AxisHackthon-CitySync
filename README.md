# CitySync - Smart City Management Platform

CitySync is a comprehensive web application designed to streamline city management and citizen services. It provides a unified platform for city administrators to manage infrastructure, monitor services, and engage with citizens, while offering citizens easy access to services and information.

## Features

### For City Administrators
- **Dashboard**: Real-time overview of city operations and key metrics
- **Infrastructure Management**: Manage public infrastructure and assets
- **Service Management**: Oversee and manage city services
- **Citizen Engagement**: Monitor citizen feedback and requests
- **Analytics**: Data-driven insights for better decision-making

### For Citizens
- **Service Requests**: Submit and track service requests
- **Feedback**: Share feedback and suggestions
- **Information Access**: Get information about city services and events
- **Notifications**: Receive updates on service requests and city announcements

## Tech Stack

### Frontend
- **Framework**: React.js
- **Language**: JavaScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### Backend
- **Framework**: Express.js
- **Language**: JavaScript
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure

```
CitySync/
├── backend/                # Express.js backend application
│   ├── config/             # Database configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Custom middleware (e.g., auth)
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── server.js           # Express server entry point
│   └── package.json
├── frontend/               # React.js frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   ├── App.jsx         # Main application component
│   │   ├── index.css       # Global styles
│   │   └── main.jsx        # React entry point
│   └── package.json
├── .gitignore              # Git ignore file
├── README.md               # Project documentation
└── package.json            # Root project dependencies
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (or yarn)
- MongoDB (running locally or cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CitySync
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration

1. **Backend Configuration**
   - Create a `.env` file in the `backend/` directory
   - Add your MongoDB connection string:
     ```env
     MONGODB_URI=mongodb://localhost:27017/citysync
     JWT_SECRET=your_secret_key
     PORT=5000
     ```

2. **Frontend Configuration**
   - The frontend automatically uses the backend URL (default: `http://localhost:5000`)
   - You can update the API base URL in `frontend/src/services/api.js` if needed

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   The server will start on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd ../frontend
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`

## Usage

### Default Credentials

**Admin User:**
- Email: [EMAIL_ADDRESS]`
- Password: `admin123`

**Citizen User:**
- Email: [EMAIL_ADDRESS]`
- Password: `citizen123`

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

#### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Create a new service (admin)
- `GET /api/services/:id` - Get service by ID
- `PUT /api/services/:id` - Update service (admin)
- `DELETE /api/services/:id` - Delete service (admin)

#### Service Requests
- `GET /api/requests` - Get all requests
- `POST /api/requests` - Create a new request
- `GET /api/requests/:id` - Get request by ID
- `PUT /api/requests/:id` - Update request (admin)
- `DELETE /api/requests/:id` - Delete request (admin)

#### Feedback
- `GET /api/feedback` - Get all feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/:id` - Get feedback by ID
- `DELETE /api/feedback/:id` - Delete feedback (admin)

## Development

### Adding New Features

1. **Create a new model** in `backend/models/`
2. **Add routes** in `backend/routes/`
3. **Create controllers** in `backend/controllers/`
4. **Update services** in `frontend/src/services/`
5. **Create pages/components** in `frontend/src/pages/` and `frontend/src/components//`

### Environment Variables

**Backend:**
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT signing
- `PORT`: Server port (default: 5000)

**Frontend:**
- `VITE_API_URL`: API base URL (default: `http://localhost:5000`)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions, please open an issue in the repository.

---

**Built with ❤️ for Axis Hackathon**