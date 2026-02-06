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
import DeviceListScreen from './src/screens/dashboard/DeviceListScreen';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';

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
  DeviceList: { filterType: string; filterValue?: string; title: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
function MainTabs() {
  const { t } = useLanguage();
  
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
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarLabel: ({ children }: { children: string }) => {
          const labelMap: Record<string, string> = {
            'Dashboard': t('nav.home'),
            'Tickets': t('nav.devices'),
            'Subscription': t('nav.subscription'),
            'Analytics': t('nav.analytics'),
            'Settings': t('nav.settings'),
          };
          return labelMap[children] || children;
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 90 : 75,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
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
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={() => ({ 
          tabBarLabel: t('nav.home'),
          title: t('nav.home'),
        })}
      />
      <Tab.Screen 
        name="Tickets" 
        component={TicketsScreen}
        options={() => ({ 
          tabBarLabel: t('nav.devices'),
          title: t('page.tickets.title'),
        })}
      />
      <Tab.Screen 
        name="Subscription" 
        component={BuySubscriptionScreen}
        options={() => ({ 
          tabBarLabel: t('nav.subscription'),
          title: t('page.subscription.title'),
        })}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={() => ({ 
          tabBarLabel: t('nav.analytics'),
          title: t('page.analytics.title'),
        })}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={() => ({ 
          tabBarLabel: t('nav.settings'),
          title: t('page.settings.title'),
        })}
      />
    </Tab.Navigator>
  );
}

// Auth Stack
function AuthStack() {
  const { t } = useLanguage();
  
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
        options={{ title: t('auth.createAccount') }}
      />
    </Stack.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

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
            options={() => ({ title: t('ticket.details') })}
          />
          <Stack.Screen
                name="CreateTicket" 
                component={CreateTicketScreen}
                options={() => ({ title: t('form.createDevice') })}
              />
              <Stack.Screen
                name="EditTicket" 
                component={EditTicketScreen}
                options={() => ({ title: t('ticket.edit') })}
              />
               <Stack.Screen 
                 name="Subscription" 
                 component={BuySubscriptionScreen}
                 options={() => ({ title: t('page.subscription.title') })}
               />
               <Stack.Screen 
                 name="DeviceList" 
                 component={DeviceListScreen}
                 options={({ route }: any) => ({ title: route.params?.title || t('dashboard.totalDevices') })}
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
