import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import GetStartedScreen from './src/screens/onboarding/GetStartedScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import TicketsScreen from './src/screens/tickets/TicketsScreen';
import TicketDetailScreen from './src/screens/tickets/TicketDetailScreen';
import CreateTicketScreen from './src/screens/tickets/CreateTicketScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import AnalyticsScreen from './src/screens/analytics/AnalyticsScreen';
import BuySubscriptionScreen from './src/screens/subscription/BuySubscriptionScreen';
import TrashScreen from './src/screens/trash/TrashScreen';
import EditTicketScreen from './src/screens/tickets/EditTicketScreen';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';

// Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  GetStarted: undefined;
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Tickets: undefined;
  TicketDetail: { ticketId: string };
  CreateTicket: undefined;
  EditTicket: { ticketId: string };
  Settings: undefined;
  Analytics: undefined;
  Subscription: undefined;
  Trash: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: any }) => ({
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tickets') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Subscription') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Trash') {
            iconName = focused ? 'trash' : 'trash-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e78a53',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarLabel: ({ children }: { children: string }) => {
          if (children === 'Tickets') {
            return 'Devices';
          }
          return children;
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 8,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={100}
            tint="dark"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255, 255, 255, 0.15)',
            }}
          />
        ),
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen 
        name="Tickets" 
        component={TicketsScreen}
        options={{ tabBarLabel: 'Devices' }}
      />
      <Tab.Screen name="Subscription" component={BuySubscriptionScreen} />
      <Tab.Screen name="Trash" component={TrashScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
      initialRouteName="GetStarted"
    >
      <Stack.Screen 
        name="GetStarted" 
        component={GetStartedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: 'Create Account' }}
      />
    </Stack.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
        <ActivityIndicator size="large" color="#e78a53" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {user ? (
        <>
          <Stack.Screen 
            name="Main" 
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="TicketDetail" 
            component={TicketDetailScreen}
            options={{ title: 'Device Details' }}
          />
          <Stack.Screen
                name="CreateTicket" 
                component={CreateTicketScreen}
                options={{ title: 'New Device' }}
              />
              <Stack.Screen
                name="EditTicket" 
                component={EditTicketScreen}
                options={{ title: 'Edit Device' }}
              />
               <Stack.Screen 
                 name="Subscription" 
                 component={BuySubscriptionScreen}
                 options={{ title: 'Subscription' }}
               />
        </>
      ) : (
        <Stack.Screen 
          name="Auth" 
          component={AuthStack}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
