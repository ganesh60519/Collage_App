import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Auth screens
import Login from './screens/Login';
import Registration from './screens/Registration';
import ForgotPassword from './screens/ForgotPassword';

// Student screens
import StudentDashboard from './screens/students/StudentDashboard';
import EditProfileScreen from './screens/students/EditProfileScreen';
import ResumeScreen from './screens/students/ResumeScreen';

// Faculty and Admin screens
import FacultyDashboard from './screens/faculty/FacultyDashboard';
import AdminDashboard from './screens/admin/AdminDashboard';

// Placeholder screens for navigation
const TasksScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Tasks Screen</Text></View>;
const TicketsScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Tickets Screen</Text></View>;
const ProfileScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Profile Screen</Text></View>;

// Create the main stack navigator
const MainStack = createStackNavigator();
const StudentStack = createStackNavigator();
const FacultyStack = createStackNavigator();
const AdminStack = createStackNavigator();

// Student Stack Navigator
const StudentStackScreen = () => {
  return (
    <StudentStack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <StudentStack.Screen name="Dashboard" component={StudentDashboard} />
      <StudentStack.Screen name="EditProfile" component={EditProfileScreen} />
      <StudentStack.Screen name="ViewResume" component={ResumeScreen} />
      <StudentStack.Screen name="Tasks" component={TasksScreen} />
      <StudentStack.Screen name="Tickets" component={TicketsScreen} />
      <StudentStack.Screen name="Profile" component={ProfileScreen} />
    </StudentStack.Navigator>
  );
};

// Faculty Stack Navigator
const FacultyStackScreen = () => {
  return (
    <FacultyStack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <FacultyStack.Screen name="Dashboard" component={FacultyDashboard} />
    </FacultyStack.Navigator>
  );
};

// Admin Stack Navigator
const AdminStackScreen = () => {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <AdminStack.Screen name="Dashboard" component={AdminDashboard} />
    </AdminStack.Navigator>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <MainStack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false
        }}
      >
        <MainStack.Screen name="Login" component={Login} />
        <MainStack.Screen name="Registration" component={Registration} />
        <MainStack.Screen name="ForgotPassword" component={ForgotPassword} />
        <MainStack.Screen name="StudentDashboard" component={StudentStackScreen} />
        <MainStack.Screen name="FacultyDashboard" component={FacultyStackScreen} />
        <MainStack.Screen name="AdminDashboard" component={AdminStackScreen} />
      </MainStack.Navigator>
    </NavigationContainer>
  );
}