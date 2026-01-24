# PanelPro Mobile - React Native App

A cross-platform mobile application that mirrors the PanelPro/Bonus Repair Desk admin panel website. Built with React Native and Expo for iOS and Android compatibility.

## 🚀 Features

- **User Authentication** - Secure login and registration
- **Dashboard** - Real-time statistics and overview
- **Ticket Management** - Create, view, edit, and delete repair tickets
- **Team Management** - Manage team members
- **Analytics** - Business insights and performance metrics
- **Settings** - Profile and account management
- **Subscription** - View subscription plans and status
- **Dark Theme** - Modern dark UI matching website design
- **Responsive Design** - Optimized for all screen sizes

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Expo CLI** (will be installed automatically)
- **iOS Simulator** (for Mac) or **Android Studio** (for Android development)
- **Your website's API URL** - Update the API base URL in `src/services/api.ts`

## 🛠️ Installation

1. **Navigate to the mobile app directory**
   ```bash
   cd mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure API URL**
   
   Open `src/services/api.ts` and update the `API_BASE_URL`:
   ```typescript
   const API_BASE_URL = __DEV__ 
     ? 'http://localhost:3000/api'  // Development (use your local IP for physical devices)
     : 'https://your-website.com/api'; // Production
   ```
   
   **Note for physical devices:** If testing on a physical device, replace `localhost` with your computer's local IP address (e.g., `http://192.168.1.100:3000/api`).

4. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

5. **Run on your preferred platform**
   - Press `i` for iOS Simulator (Mac only)
   - Press `a` for Android Emulator
   - Scan the QR code with Expo Go app on your physical device

## 📱 Running the App

### Development Mode

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web (for testing)
npm run web
```

### Using Expo Go App

1. Install **Expo Go** from App Store (iOS) or Google Play (Android)
2. Start the development server with `npm start`
3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## 🏗️ Building for Production

### iOS Build

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure app.json**
   - Update `app.json` with your app details (name, bundle identifier, etc.)

4. **Build for iOS**
   ```bash
   eas build --platform ios
   ```

5. **Submit to App Store**
   ```bash
   eas submit --platform ios
   ```

### Android Build

1. **Build APK/AAB**
   ```bash
   eas build --platform android
   ```

2. **Submit to Google Play**
   ```bash
   eas submit --platform android
   ```

### Local Build (Advanced)

For local builds, you'll need to:

1. **Install native dependencies**
   ```bash
   npx expo prebuild
   ```

2. **iOS** (Mac only)
   ```bash
   cd ios
   pod install
   cd ..
   npx react-native run-ios
   ```

3. **Android**
   ```bash
   npx react-native run-android
   ```

## 📁 Project Structure

```
mobile-app/
├── App.tsx                 # Main app entry point
├── app.json                 # Expo configuration
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
└── src/
    ├── context/             # React contexts (Auth, Theme)
    ├── screens/              # Screen components
    │   ├── auth/            # Login, Register
    │   ├── dashboard/       # Dashboard screen
    │   ├── tickets/         # Ticket management
    │   ├── team/            # Team management
    │   ├── settings/        # Settings screen
    │   ├── analytics/       # Analytics screen
    │   └── subscription/    # Subscription screen
    └── services/            # API service layer
```

## 🔧 Configuration

### API Configuration

The app communicates with your website's API. Make sure:

1. Your website API is accessible
2. CORS is properly configured for mobile requests
3. Authentication endpoints match the expected format

### Environment Variables

For different environments, you can use Expo's environment variables:

1. Create `.env` file:
   ```env
   API_URL=https://your-api.com/api
   ```

2. Install `react-native-dotenv`:
   ```bash
   npm install react-native-dotenv
   ```

3. Update `babel.config.js` to include the plugin

### Theme Customization

Edit `src/context/ThemeContext.tsx` to customize colors, spacing, and other theme values to match your brand.

## 🔐 Authentication Flow

1. User logs in or registers
2. JWT token is stored in AsyncStorage
3. Token is included in API requests
4. User data is cached locally
5. On logout, token and user data are cleared

## 📡 API Integration

The app uses the following API endpoints:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/users?id={userId}` - Get user details
- `PUT /api/users/{userId}` - Update user
- `GET /api/repairs?userId={userId}` - Get tickets
- `GET /api/repairs/{id}` - Get ticket details
- `POST /api/repairs/create` - Create ticket
- `PUT /api/repairs/{id}` - Update ticket
- `DELETE /api/repairs/{id}` - Delete ticket
- `GET /api/team?userId={userId}` - Get team members
- `GET /api/payments?userId={userId}` - Get subscriptions

## 🐛 Troubleshooting

### Common Issues

1. **Network Error on Physical Device**
   - Use your computer's local IP instead of `localhost`
   - Ensure device and computer are on the same network
   - Check firewall settings

2. **Metro Bundler Issues**
   ```bash
   npm start -- --reset-cache
   ```

3. **iOS Build Errors**
   - Run `cd ios && pod install && cd ..`
   - Clean build folder in Xcode

4. **Android Build Errors**
   - Clean gradle: `cd android && ./gradlew clean && cd ..`
   - Check Android SDK versions

5. **TypeScript Errors**
   - Run `npx tsc --noEmit` to check types
   - Ensure all dependencies are installed

## 📝 Development Tips

1. **Hot Reload**: Enabled by default. Save files to see changes instantly.

2. **Debugging**: 
   - Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
   - Use React Native Debugger or Chrome DevTools

3. **Performance**:
   - Use `React.memo` for expensive components
   - Optimize images and assets
   - Use FlatList for long lists

4. **Testing**:
   - Test on both iOS and Android
   - Test on different screen sizes
   - Test with slow network (use Network Link Conditioner)

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Update API URL to production endpoint
- [ ] Update app name, bundle ID, and package name
- [ ] Configure app icons and splash screens
- [ ] Set up app signing certificates
- [ ] Test on physical devices
- [ ] Review and update privacy policy
- [ ] Test all features end-to-end
- [ ] Optimize app size and performance
- [ ] Set up crash reporting (e.g., Sentry)
- [ ] Configure analytics (e.g., Firebase Analytics)

## 📄 License

This project is part of the PanelPro/Bonus Repair Desk platform.

## 🤝 Support

For issues and questions:
- Check the website documentation
- Review API endpoint documentation
- Contact support

---

**Happy Coding! 🎉**
