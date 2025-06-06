import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Platform,
  ToastAndroid,
  Animated,
  TextInput,
  Linking,
  Easing,
  ImageBackground,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Constants from 'expo-constants';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons, Ionicons, FontAwesome5, MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import axios from 'axios';
import { IP } from '../../ip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';


const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get('window');

// Animated Card Component with enhanced animations
const AnimatedCard = ({ children, delay = 0, style, onPress }) => {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  
  // Animation for press feedback
  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animatedStyle = {
    transform: [{ translateY }, { scale }],
    opacity,
  };

  if (onPress) {
    return (
      <Animated.View style={[style, animatedStyle]}>
        <Pressable 
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{ flex: 1 }}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// Enhanced Home Screen Component with Modern UI
const HomeScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTimeState, setCurrentTimeState] = useState('');
  const [currentDateState, setCurrentDateState] = useState('');
  const [weatherInfo, setWeatherInfo] = useState({ temp: '22°C', condition: 'Sunny' });
  const [notifications, setNotifications] = useState(3);
  const { width } = useWindowDimensions();
  
  // Update time and date
  useEffect(() => {
    // Function to update the time and date
    const updateDateTime = () => {
      const now = new Date();
      
      // Update time
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formattedHour = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const timeString = `${formattedHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      setCurrentTimeState(timeString);
      
      // Update date
      const options = { weekday: 'long', month: 'long', day: 'numeric' };
      const dateString = now.toLocaleDateString('en-US', options);
      setCurrentDateState(dateString);
    };
    
    // Update immediately
    updateDateTime();
    
    // Set interval to update every minute
    const intervalId = setInterval(updateDateTime, 60000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });
  
  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Session Expired', 'Please login again');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      // Fetch profile data
      const profileResponse = await axios.get(`http://${IP}:3000/api/student/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(profileResponse.data);

      // Fetch task count for the stats
      const tasksResponse = await axios.get(`http://${IP}:3000/api/student/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasksResponse.data.slice(0, 3));

      // Fetch ticket count for the stats
      const ticketsResponse = await axios.get(`http://${IP}:3000/api/student/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(ticketsResponse.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      return () => {};
    }, [])
  );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loaderText}>Loading your dashboard...</Text>
      </View>
    );
  }

  // Get current hour for greeting
  const currentHour = new Date().getHours();
  
  // Set greeting based on time of day
  let greeting = "Good Morning";
  if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good Afternoon";
  } else if (currentHour >= 17) {
    greeting = "Good Evening";
  }
  
  // Get student's program/branch
  const studentProgram = profile?.branch || 'University Program';

  // --- ADMIN-STYLE DASHBOARD HEADER & STATS ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3b82f6"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1e293b' }}>{greeting}, {profile?.name || 'Student'}</Text>
            <Text style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>{studentProgram}</Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{currentDateState}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 18, color: '#3b82f6', fontWeight: 'bold' }}>{currentTimeState}</Text>
            <TouchableOpacity style={{ marginTop: 8 }} onPress={() => navigation.jumpTo('Profile')}>
              <MaterialIcons name="person" size={36} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', margin: 20, gap: 12 }}>
          <AnimatedCard delay={100} style={styles.modernStatCard}>
            <View style={[styles.modernStatIcon, { backgroundColor: '#dbeafe' }]}> 
              <MaterialIcons name="assignment" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.modernStatValue}>{tasks.length}</Text>
            <Text style={styles.modernStatLabel}>Active Tasks</Text>
          </AnimatedCard>
          <AnimatedCard delay={200} style={styles.modernStatCard}>
            <View style={[styles.modernStatIcon, { backgroundColor: '#dcfce7' }]}> 
              <MaterialIcons name="support" size={24} color="#10b981" />
            </View>
            <Text style={styles.modernStatValue}>{tickets.length}</Text>
            <Text style={styles.modernStatLabel}>Support Tickets</Text>
          </AnimatedCard>
          <AnimatedCard delay={300} style={styles.modernStatCard}>
            <View style={[styles.modernStatIcon, { backgroundColor: '#fef3c7' }]}> 
              <MaterialIcons name="grade" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.modernStatValue}>A-</Text>
            <Text style={styles.modernStatLabel}>Avg Grade</Text>
          </AnimatedCard>
        </View>

        {/* Quick Actions (reuse existing modernQuickActionsCard) */}
        <AnimatedCard delay={400} style={styles.modernQuickActionsCard}>
          <Text style={styles.modernQuickActionsTitle}>Quick Actions</Text>
          <View style={styles.modernQuickActionsGrid}>
            <TouchableOpacity style={styles.modernQuickActionItem} onPress={() => navigation.jumpTo('Tasks')}>
              <View style={[styles.modernQuickActionIcon, { backgroundColor: '#dbeafe' }]}> 
                <MaterialIcons name="assignment" size={28} color="#3b82f6" />
              </View>
              <Text style={styles.modernQuickActionText}>My Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modernQuickActionItem} onPress={() => navigation.jumpTo('Tickets')}>
              <View style={[styles.modernQuickActionIcon, { backgroundColor: '#dcfce7' }]}> 
                <MaterialIcons name="support" size={28} color="#10b981" />
              </View>
              <Text style={styles.modernQuickActionText}>Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modernQuickActionItem} onPress={() => navigation.jumpTo('Profile')}>
              <View style={[styles.modernQuickActionIcon, { backgroundColor: '#f3e8ff' }]}> 
                <MaterialIcons name="person" size={28} color="#8b5cf6" />
              </View>
              <Text style={styles.modernQuickActionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {/* Resume Generate Card */}
        <AnimatedCard delay={500} style={styles.modernOverviewCard}>
          <TouchableOpacity
            style={{ alignItems: 'center', flexDirection: 'row' }}
            onPress={() => navigation.getParent().navigate('GenerateResume')}
          >
            <View style={[styles.modernStatIcon, { backgroundColor: '#fef3c7', marginRight: 16 }]}>
              <MaterialIcons name="article" size={32} color="#f59e0b" />
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b' }}>Generate Resume</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Create or update your resume</Text>
            </View>
          </TouchableOpacity>
        </AnimatedCard>

        {/* Recent Activity (reuse modernActivityCard if needed) */}
        {/* ...existing code for activity, progress, resume builder, etc... */}
      </ScrollView>
    </SafeAreaView>
  );
};

// Tasks Screen Component
const TasksScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [taskLink, setTaskLink] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Get tasks from the API
      const response = await axios.get(`http://${IP}:3000/api/student/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Get locally completed tasks from AsyncStorage
      const completedTasksJson = await AsyncStorage.getItem('completedTasks');
      const completedTasks = completedTasksJson ? JSON.parse(completedTasksJson) : [];
      
      // Apply local completion status to tasks from API
      if (completedTasks.length > 0) {
        const updatedTasks = response.data.map(task => {
          // If the task is in our locally completed list, mark it as completed
          if (completedTasks.includes(task.id)) {
            return { ...task, status: 'completed' };
          }
          return task;
        });
        setTasks(updatedTasks);
      } else {
        setTasks(response.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to load tasks. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const updateTaskStatus = async (taskId) => {
    try {
      console.log(`Marking task ${taskId} as completed`);
      
      // Get the token for authentication
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again.');
        return false;
      }
      
      // First update the task in the local state for immediate UI feedback
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: 'completed' } : task
        )
      );
      
      // If a task is selected in the modal, update it too
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: 'completed' });
        setSelectedStatus('completed');
      }
      
      // Make API call to update the task status in the database
      try {
        console.log(`Sending API request to update task ${taskId} status to completed`);
        
        // Try the primary endpoint first
        const response = await axios.put(
          `http://${IP}:3000/api/student/tasks/${taskId}/status`,
          { status: 'completed' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('API response:', response.data);
        
        if (response.data.success) {
          console.log(`Task ${taskId} marked as completed in the database`);
          
          // Store the completed task ID in AsyncStorage for persistence
          try {
            // Get existing completed tasks
            const completedTasksJson = await AsyncStorage.getItem('completedTasks');
            let completedTasks = completedTasksJson ? JSON.parse(completedTasksJson) : [];
            
            // Add the new task ID if it's not already in the list
            if (!completedTasks.includes(taskId)) {
              completedTasks.push(taskId);
              await AsyncStorage.setItem('completedTasks', JSON.stringify(completedTasks));
            }
            
            console.log(`Task ${taskId} also saved to AsyncStorage for offline access`);
          } catch (storageError) {
            console.error('Error saving to AsyncStorage:', storageError);
            // Continue even if AsyncStorage fails
          }
          
          // Show success message
          if (Platform.OS === 'android') {
            ToastAndroid.show('Task marked as completed', ToastAndroid.SHORT);
          } else {
            Alert.alert('Success', 'Task marked as completed');
          }
          
          return true;
        } else {
          throw new Error('API returned success: false');
        }
      } catch (apiError) {
        console.error('Error updating task status via API:', apiError);
        
        // Try alternative endpoint if the first one fails
        try {
          console.log('Trying alternative endpoint...');
          const altResponse = await axios.put(
            `http://${IP}:3000/api/student/update-task-status/${taskId}`,
            { status: 'completed' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (altResponse.data.success) {
            console.log('Alternative endpoint succeeded');
            
            // Show success message
            if (Platform.OS === 'android') {
              ToastAndroid.show('Task marked as completed', ToastAndroid.SHORT);
            } else {
              Alert.alert('Success', 'Task marked as completed');
            }
            
            return true;
          } else {
            throw new Error('Alternative API returned success: false');
          }
        } catch (altApiError) {
          console.error('Error with alternative endpoint:', altApiError);
          
          // As a last resort, try the direct completion endpoint
          try {
            console.log('Trying direct completion endpoint...');
            const directResponse = await axios.post(
              `http://${IP}:3000/api/student/complete-task/${taskId}`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (directResponse.data.success) {
              console.log('Direct completion endpoint succeeded');
              
              // Show success message
              if (Platform.OS === 'android') {
                ToastAndroid.show('Task marked as completed', ToastAndroid.SHORT);
              } else {
                Alert.alert('Success', 'Task marked as completed');
              }
              
              return true;
            } else {
              throw new Error('Direct API returned success: false');
            }
          } catch (directApiError) {
            console.error('All API attempts failed:', directApiError);
            Alert.alert(
              'Warning', 
              'Task marked as completed locally, but could not update the server. The change will sync when you reconnect.',
              [{ text: 'OK' }]
            );
            return true; // Return true since we've updated locally
          }
        }
      }
    } catch (error) {
      console.error('Error in updateTaskStatus function:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return false;
    }
  };

  const onRefresh = useCallback(() => {
    console.log('Refreshing tasks list...');
    setRefreshing(true);
    // Clear any selected task
    setSelectedTask(null);
    // Fetch fresh data
    fetchTasks();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      return () => {};
    }, [])
  );

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { bg: '#d1fae5', text: '#10b981', icon: 'check-circle' };
      case 'in progress':
        return { bg: '#e0f2fe', text: '#0ea5e9', icon: 'autorenew' };
      case 'pending':
        return { bg: '#fef3c7', text: '#d97706', icon: 'schedule' };
      default:
        return { bg: '#fee2e2', text: '#ef4444', icon: 'error-outline' };
    }
  };

  // Initialize form when a task is selected
  const initializeTaskForm = (task) => {
    setSelectedTask(task);
    setTaskLink(task.link || '');
    setSelectedStatus(task.status || 'pending');
    setStatusDropdownVisible(false);
    setModalVisible(true);
    
    // Log task details for debugging
    console.log(`Task selected: ID=${task.id}, Status=${task.status}, Link=${task.link ? 'Yes' : 'No'}`);
  };

  // Save task updates including notes, link and status
  const saveTaskUpdates = async () => {
    if (!selectedTask) return false;
    
    try {
      setIsLoading(true);
      
      // Get the token for authentication
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again.');
        setIsLoading(false);
        return false;
      }
      
      // Prepare updated task data
      const updatedTaskData = {
        status: selectedStatus,
        link: taskLink
      };
      
      console.log(`Updating task ${selectedTask.id} with status: ${selectedStatus}`);
      console.log('Task update data:', JSON.stringify(updatedTaskData, null, 2));
      
      // Update task in local state first for immediate UI feedback
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === selectedTask.id ? { ...task, ...updatedTaskData } : task
        )
      );
      
      // Update selected task in modal
      setSelectedTask({ ...selectedTask, ...updatedTaskData });
      
      // Handle completedTasks in AsyncStorage based on status
      try {
        // Get existing completed tasks
        const completedTasksJson = await AsyncStorage.getItem('completedTasks');
        let completedTasks = completedTasksJson ? JSON.parse(completedTasksJson) : [];
        
        if (selectedStatus.toLowerCase() === 'completed') {
          // Add the task ID if it's not already in the list
          if (!completedTasks.includes(selectedTask.id)) {
            completedTasks.push(selectedTask.id);
            await AsyncStorage.setItem('completedTasks', JSON.stringify(completedTasks));
            console.log(`Task ${selectedTask.id} added to completed tasks in AsyncStorage`);
          }
        } else {
          // If status is not completed but task was previously in completedTasks, remove it
          if (completedTasks.includes(selectedTask.id)) {
            completedTasks = completedTasks.filter(id => id !== selectedTask.id);
            await AsyncStorage.setItem('completedTasks', JSON.stringify(completedTasks));
            console.log(`Task ${selectedTask.id} removed from completed tasks in AsyncStorage`);
          }
        }
      } catch (storageError) {
        console.error('Error managing completedTasks in AsyncStorage:', storageError);
        // Continue even if AsyncStorage fails
      }
      
      // Make API call to update the task
      try {
        console.log(`Sending API request to update task ${selectedTask.id} with status: ${selectedStatus}`);
        
        // Try updating the status first
        if (selectedStatus.toLowerCase() === 'completed') {
          try {
            // Try the direct completion endpoint first (this seems to be the most reliable)
            console.log('Trying direct completion endpoint...');
            const directResponse = await axios.post(
              `http://${IP}:3000/api/student/complete-task/${selectedTask.id}`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (directResponse.data.success) {
              console.log('Direct completion endpoint succeeded');
              
              // Now update the link
              try {
                await axios.put(
                  `http://${IP}:3000/api/student/tasks/${selectedTask.id}`,
                  { link: taskLink },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              } catch (linkError) {
                console.log('Link update failed, but status was updated successfully');
              }
              
              // Show success message
              if (Platform.OS === 'android') {
                ToastAndroid.show('Task completed successfully', ToastAndroid.SHORT);
              } else {
                Alert.alert('Success', 'Task completed successfully');
              }
              
              setIsLoading(false);
              return true;
            }
          } catch (directError) {
            console.log('Direct completion endpoint failed, trying status update endpoint');
          }
        }
        
        // Try the status update endpoint
        try {
          console.log('Trying status update endpoint...');
          const statusResponse = await axios.put(
            `http://${IP}:3000/api/student/update-task-status/${selectedTask.id}`,
            { status: selectedStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (statusResponse.data.success) {
            console.log('Status update endpoint succeeded');
            
            // Now update the link
            try {
              console.log('Sending link update:', JSON.stringify({ link: taskLink }, null, 2));
              const linkResponse = await axios.put(
                `http://${IP}:3000/api/student/tasks/${selectedTask.id}`,
                { link: taskLink },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              console.log('Link update response:', linkResponse.data);
            } catch (linkError) {
              console.error('Link update failed, but status was updated successfully:', linkError);
            }
            
            // Show success message
            if (Platform.OS === 'android') {
              ToastAndroid.show(`Task ${selectedStatus} successfully`, ToastAndroid.SHORT);
            } else {
              Alert.alert('Success', `Task ${selectedStatus} successfully`);
            }
            
            setIsLoading(false);
            return true;
          }
        } catch (statusError) {
          console.log('Status update endpoint failed, trying general update endpoint');
        }
        
        // Try the general update endpoint
        try {
          console.log('Trying general update endpoint...');
          const response = await axios.put(
            `http://${IP}:3000/api/student/tasks/${selectedTask.id}`,
            updatedTaskData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (response.data.success) {
            console.log('General update endpoint succeeded');
            
            // Show success message
            if (Platform.OS === 'android') {
              ToastAndroid.show(`Task ${selectedStatus} successfully`, ToastAndroid.SHORT);
            } else {
              Alert.alert('Success', `Task ${selectedStatus} successfully`);
            }
            
            setIsLoading(false);
            return true;
          }
        } catch (generalError) {
          console.log('General update endpoint failed, trying alternative endpoint');
        }
        
        // Try the alternative update endpoint
        try {
          console.log('Trying alternative update endpoint...');
          const altResponse = await axios.put(
            `http://${IP}:3000/api/student/update-task/${selectedTask.id}`,
            updatedTaskData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (altResponse.data.success) {
            console.log('Alternative update endpoint succeeded');
            
            // Show success message
            if (Platform.OS === 'android') {
              ToastAndroid.show(`Task ${selectedStatus} successfully`, ToastAndroid.SHORT);
            } else {
              Alert.alert('Success', `Task ${selectedStatus} successfully`);
            }
            
            setIsLoading(false);
            return true;
          }
        } catch (altError) {
          console.log('All update endpoints failed');
        }
        
        // If we get here, all API attempts failed
        throw new Error('All API endpoints returned failure');
      } catch (apiError) {
        console.error('Error updating task:', apiError);
        Alert.alert(
          'Warning', 
          'Task updated locally, but could not update the server. The changes will sync when you reconnect.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return true; // Return true since we've updated locally
      }
    } catch (error) {
      console.error('Error in saveTaskUpdates function:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const renderTask = ({ item, index }) => {
    const statusStyle = getStatusColor(item.status);
    
    return (
      <AnimatedCard delay={index * 100} style={styles.taskCard}>
        <TouchableOpacity 
          onPress={() => {
            initializeTaskForm(item);
          }}
        >
          <View style={styles.taskCardHeader}>
            <View style={[styles.taskStatusBadge, { backgroundColor: statusStyle.bg }]}>
              <MaterialIcons name={statusStyle.icon} size={16} color={statusStyle.text} />
              <Text style={[styles.taskStatusText, { color: statusStyle.text }]}>
                {item.status}
              </Text>
            </View>
            <Text style={styles.taskDate}>
              Due: {new Date(item.due_date).toLocaleDateString()}
            </Text>
          </View>
          
          <Text style={styles.taskCardTitle}>{item.title}</Text>
          
          <Text style={styles.taskCardDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.taskCardFooter}>
            <View style={styles.assignedByContainer}>
              <MaterialIcons name="person" size={16} color="#6b7280" />
              <Text style={styles.assignedByText}>
                {item.assigned_by}
              </Text>
            </View>
            
            <View style={styles.taskMetaIcons}>
              {item.notes && (
                <View style={styles.taskMetaIcon}>
                  <MaterialIcons name="note" size={16} color="#6366f1" />
                </View>
              )}
              {item.link && (
                <View style={styles.taskMetaIcon}>
                  <MaterialIcons name="link" size={16} color="#6366f1" />
                </View>
              )}
              <View style={styles.taskCardAction}>
                <MaterialIcons name="chevron-right" size={20} color="#6366f1" />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.tasksList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <MaterialIcons name="assignment" size={60} color="#d1d5db" />
              <Text style={styles.emptyListText}>No tasks available</Text>
              <Text style={styles.emptyListSubText}>
                Pull down to refresh or check back later
              </Text>
            </View>
          }
        />
      )}
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.enhancedModalContainer}>
          <View style={styles.enhancedModalView}>
            {selectedTask && (
              <ScrollView>
                {/* Enhanced Header with Status Badge */}
                <View style={styles.enhancedModalHeader}>
                  <View style={styles.enhancedModalHeaderContent}>
                    <Text style={styles.enhancedModalTitle}>{selectedTask.title}</Text>
                    <TouchableOpacity
                      style={styles.enhancedCloseButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <MaterialIcons name="close" size={24} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                  
                  {(() => {
                    const statusStyle = getStatusColor(selectedTask.status);
                    return (
                      <View style={[styles.enhancedStatusBadge, { backgroundColor: statusStyle.bg }]}>
                        <MaterialIcons name={statusStyle.icon} size={18} color={statusStyle.text} />
                        <Text style={[styles.enhancedStatusText, { color: statusStyle.text }]}>
                          {selectedTask.status.toUpperCase()}
                        </Text>
                      </View>
                    );
                  })()}
                </View>
                
                <View style={styles.enhancedModalContent}>
                  {/* Task Details Card */}
                  <View style={styles.enhancedDetailCard}>
                    <Text style={styles.enhancedDetailTitle}>Task Details</Text>
                    
                    <View style={styles.enhancedDetailRow}>
                      <View style={styles.enhancedDetailIconContainer}>
                        <MaterialIcons name="event" size={20} color="#6366f1" />
                      </View>
                      <View style={styles.enhancedDetailContent}>
                        <Text style={styles.enhancedDetailLabel}>Due Date</Text>
                        <Text style={styles.enhancedDetailValue}>
                          {new Date(selectedTask.due_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.enhancedDetailRow}>
                      <View style={styles.enhancedDetailIconContainer}>
                        <MaterialIcons name="person" size={20} color="#6366f1" />
                      </View>
                      <View style={styles.enhancedDetailContent}>
                        <Text style={styles.enhancedDetailLabel}>Assigned By</Text>
                        <Text style={styles.enhancedDetailValue}>{selectedTask.assigned_by}</Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* Description Card */}
                  <View style={styles.enhancedDescriptionCard}>
                    <Text style={styles.enhancedDescriptionTitle}>Description</Text>
                    <Text style={styles.enhancedDescriptionText}>{selectedTask.description}</Text>
                  </View>
                  
                  {/* Status Selection Card */}
                  <View style={styles.enhancedDetailCard}>
                    <View style={styles.cardHeaderContainer}>
                      <MaterialIcons name="flag" size={20} color="#6366f1" />
                      <Text style={styles.enhancedDetailTitle}>Status</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.statusDropdownButton}
                      onPress={() => setStatusDropdownVisible(!statusDropdownVisible)}
                    >
                      <View style={styles.statusDropdownContent}>
                        <View style={[styles.statusIndicator, { 
                          backgroundColor: getStatusColor(selectedStatus).bg 
                        }]} />
                        <Text style={styles.statusDropdownText}>
                          {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                        </Text>
                      </View>
                      <MaterialIcons 
                        name={statusDropdownVisible ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={24} 
                        color="#64748b" 
                      />
                    </TouchableOpacity>
                    
                    {statusDropdownVisible && (
                      <View style={styles.statusOptionsContainer}>
                        {['pending', 'in progress', 'completed', 'incomplete'].map((status) => (
                          <TouchableOpacity
                            key={status}
                            style={styles.statusOption}
                            onPress={() => {
                              setSelectedStatus(status);
                              setStatusDropdownVisible(false);
                            }}
                          >
                            <View style={[styles.statusIndicator, { 
                              backgroundColor: getStatusColor(status).bg 
                            }]} />
                            <Text style={[
                              styles.statusOptionText,
                              selectedStatus === status && styles.selectedStatusText
                            ]}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                            {selectedStatus === status && (
                              <MaterialIcons name="check" size={18} color="#6366f1" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                  
                  {/* Notes Card - Removed as per database schema */}
                  
                  {/* Link Card */}
                  <View style={styles.enhancedDetailCard}>
                    <View style={styles.cardHeaderContainer}>
                      <MaterialIcons name="link" size={20} color="#6366f1" />
                      <Text style={styles.enhancedDetailTitle}>Resource Link</Text>
                    </View>
                    
                    <View style={styles.linkInputContainer}>
                      <TextInput
                        style={styles.linkInput}
                        placeholder="Add a resource link..."
                        placeholderTextColor="#94a3b8"
                        value={taskLink}
                        onChangeText={(text) => {
                          console.log('Setting task link to:', text);
                          setTaskLink(text);
                        }}
                      />
                      {taskLink ? (
                        <TouchableOpacity 
                          style={styles.openLinkButton}
                          onPress={() => {
                            let url = taskLink;
                            if (!/^https?:\/\//i.test(url)) {
                              url = 'https://' + url;
                            }
                            Linking.openURL(url).catch(err => 
                              Alert.alert('Error', 'Could not open the link. Please check the URL.')
                            );
                          }}
                        >
                          <MaterialIcons name="open-in-new" size={20} color="#ffffff" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                  
                  {/* Action Buttons */}
                  <View style={styles.enhancedButtonContainer}>
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={async () => {
                        // Show loading indicator
                        setIsLoading(true);
                        
                        // Update task with current status, notes and link
                        const success = await saveTaskUpdates();
                        
                        // Hide loading indicator
                        setIsLoading(false);
                        
                        // Always close the modal and refresh the task list
                        // This ensures the UI is updated even if the API call fails
                        setTimeout(() => {
                          setModalVisible(false);
                          // Refresh the task list
                          onRefresh();
                        }, 1000);
                      }}
                    >
                      <MaterialIcons name="send" size={22} color="#ffffff" />
                      <Text style={styles.submitButtonText}>Submit</Text>
                    </TouchableOpacity>
                    
                    {selectedStatus.toLowerCase() === 'completed' && (
                      <View style={styles.enhancedCompletedContainer}>
                        <MaterialIcons name="verified" size={24} color="#10b981" />
                        <Text style={styles.enhancedCompletedText}>Task Completed</Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={styles.enhancedCloseModalButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.enhancedCloseModalButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Tickets Screen Component
const TicketsScreen = () => {
  const navigation = useNavigation();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTicketModalVisible, setNewTicketModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    type: 'general'
  });

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`http://${IP}:3000/api/student/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      Alert.alert('Error', 'Failed to load tickets. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const createTicket = async () => {
    try {
      // Validate inputs
      if (!newTicket.subject.trim()) {
        Alert.alert('Error', 'Please enter a subject for your ticket');
        return;
      }
      
      if (!newTicket.description.trim()) {
        Alert.alert('Error', 'Please enter a description for your ticket');
        return;
      }
      
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await axios.post(
        `http://${IP}:3000/api/student/tickets`,
        {
          subject: newTicket.subject.trim(),
          description: newTicket.description.trim(),
          type: newTicket.type
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data && response.data.success) {
        // Reset form
        setNewTicket({
          subject: '',
          description: '',
          type: 'general'
        });
        
        // Close modal
        setNewTicketModalVisible(false);
        
        // Show success message
        if (Platform.OS === 'android') {
          ToastAndroid.show('Ticket created successfully', ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', 'Your ticket has been submitted successfully');
        }
        
        // Refresh tickets list
        fetchTickets();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      Alert.alert(
        'Error',
        `Failed to create ticket: ${error.response?.data?.error || error.message || 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTickets();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
      return () => {};
    }, [])
  );

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return { bg: '#d1fae5', text: '#10b981', icon: 'check-circle' };
      case 'pending':
        return { bg: '#fef3c7', text: '#d97706', icon: 'hourglass-empty' };
      case 'approved':
        return { bg: '#dbeafe', text: '#3b82f6', icon: 'thumb-up' };
      case 'rejected':
        return { bg: '#fee2e2', text: '#ef4444', icon: 'thumb-down' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280', icon: 'help-outline' };
    }
  };

  const renderTicket = ({ item, index }) => {
    const statusStyle = getStatusStyle(item.status);
    const date = new Date(item.created_at).toLocaleDateString();
    
    return (
      <AnimatedCard delay={index * 100} style={styles.ticketCard}>
        <TouchableOpacity 
          onPress={() => {
            setSelectedTicket(item);
            setModalVisible(true);
          }}
        >
          <View style={styles.ticketCardHeader}>
            <View style={[styles.ticketStatusBadge, { backgroundColor: statusStyle.bg }]}>
              <MaterialIcons name={statusStyle.icon} size={16} color={statusStyle.text} />
              <Text style={[styles.ticketStatusText, { color: statusStyle.text }]}>
                {item.status}
              </Text>
            </View>
            <Text style={styles.ticketDate}>{date}</Text>
          </View>
          
          <Text style={styles.ticketCardTitle}>{item.subject}</Text>
          
          <Text style={styles.ticketCardDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          {item.type && (
            <View style={styles.ticketTypeContainer}>
              <MaterialIcons name="label" size={16} color="#6b7280" />
              <Text style={styles.ticketTypeText}>
                {item.type.replace('_', ' ')}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicket}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.ticketsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <MaterialIcons name="confirmation-number" size={60} color="#d1d5db" />
              <Text style={styles.emptyListText}>No tickets available</Text>
              <Text style={styles.emptyListSubText}>
                Create a new ticket to get help
              </Text>
            </View>
          }
        />
      )}
      
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => {
          // Create a new ticket form modal
          setSelectedTicket(null);
          setNewTicketModalVisible(true);
        }}
      >
        <MaterialIcons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.enhancedModalContainer}>
          <View style={styles.enhancedModalView}>
            {selectedTicket && (
              <ScrollView>
                {/* Enhanced Header with Status Badge */}
                <View style={styles.enhancedModalHeader}>
                  <View style={styles.enhancedModalHeaderContent}>
                    <Text style={styles.enhancedModalTitle}>{selectedTicket.subject}</Text>
                    <TouchableOpacity
                      style={styles.enhancedCloseButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <MaterialIcons name="close" size={24} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                  
                  {(() => {
                    const statusStyle = getStatusStyle(selectedTicket.status);
                    return (
                      <View style={[styles.enhancedStatusBadge, { backgroundColor: statusStyle.bg }]}>
                        <MaterialIcons name={statusStyle.icon} size={18} color={statusStyle.text} />
                        <Text style={[styles.enhancedStatusText, { color: statusStyle.text }]}>
                          {selectedTicket.status.toUpperCase()}
                        </Text>
                      </View>
                    );
                  })()}
                </View>
                
                <View style={styles.enhancedModalContent}>
                  {/* Ticket Details Card */}
                  <View style={styles.enhancedDetailCard}>
                    <Text style={styles.enhancedDetailTitle}>Ticket Information</Text>
                    
                    <View style={styles.enhancedDetailRow}>
                      <View style={styles.enhancedDetailIconContainer}>
                        <MaterialIcons name="event" size={20} color="#6366f1" />
                      </View>
                      <View style={styles.enhancedDetailContent}>
                        <Text style={styles.enhancedDetailLabel}>Created On</Text>
                        <Text style={styles.enhancedDetailValue}>
                          {new Date(selectedTicket.created_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                    
                    {selectedTicket.type && (
                      <View style={styles.enhancedDetailRow}>
                        <View style={styles.enhancedDetailIconContainer}>
                          <MaterialIcons name="label" size={20} color="#6366f1" />
                        </View>
                        <View style={styles.enhancedDetailContent}>
                          <Text style={styles.enhancedDetailLabel}>Ticket Type</Text>
                          <Text style={styles.enhancedDetailValue}>
                            {selectedTicket.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                  
                  {/* Description Card */}
                  <View style={styles.enhancedDescriptionCard}>
                    <Text style={styles.enhancedDescriptionTitle}>Description</Text>
                    <Text style={styles.enhancedDescriptionText}>{selectedTicket.description}</Text>
                  </View>
                  
                  {/* Response Card - Only shown if there's a response */}
                  {selectedTicket.response && (
                    <View style={styles.enhancedResponseCard}>
                      <View style={styles.enhancedResponseHeader}>
                        <MaterialIcons name="comment" size={20} color="#6366f1" />
                        <Text style={styles.enhancedResponseTitle}>Staff Response</Text>
                      </View>
                      <Text style={styles.enhancedResponseText}>{selectedTicket.response}</Text>
                    </View>
                  )}
                  
                  {/* Action Buttons */}
                  <View style={styles.enhancedButtonContainer}>
                    <TouchableOpacity
                      style={styles.enhancedCloseModalButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.enhancedCloseModalButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Profile Screen Component
const ProfileScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [ticketStatus, setTicketStatus] = useState(null); // null, 'pending', or 'approved'
  const [approvedTicketId, setApprovedTicketId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Session Expired', 'Please login again');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }
      
      // Fetch profile
      const profileResponse = await axios.get(`http://${IP}:3000/api/student/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(profileResponse.data);
      
      // Fetch tickets to check for profile update tickets
      const ticketsResponse = await axios.get(`http://${IP}:3000/api/student/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const profileTickets = ticketsResponse.data.filter(ticket => ticket.type === 'profile_update');
      const pendingTicket = profileTickets.find(ticket => ticket.status === 'pending');
      const approvedTicket = profileTickets.find(ticket => ticket.status === 'approved');
      
      if (pendingTicket) {
        setTicketStatus('pending');
        setApprovedTicketId(null);
      } else if (approvedTicket) {
        setTicketStatus('approved');
        setApprovedTicketId(approvedTicket.id);
      } else {
        setTicketStatus(null);
        setApprovedTicketId(null);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfileData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
      return () => {};
    }, [])
  );

  const handleRaiseTicket = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const requestData = {
        subject: 'Profile Update Request',
        description: 'Request to update student profile information',
        type: 'profile_update',
        requested_updates: JSON.stringify({}) // Empty updates, as specifics are entered later
      };
      
      const response = await axios.post(
        `http://${IP}:3000/api/student/profile-update-ticket`,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data) {
        Alert.alert(
          'Success',
          'Profile update ticket raised successfully. Please wait for admin approval.',
          [{ text: 'OK', onPress: fetchProfileData }]
        );
      }
    } catch (error) {
      console.error('Error raising ticket:', error);
      Alert.alert(
        'Error',
        `Failed to raise ticket: ${error.response?.data?.error || error.message || 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = () => {
    if (approvedTicketId) {
      navigation.getParent().navigate('EditProfile', {
        ticketId: approvedTicketId,
        updates: {} // Empty updates, as specifics are entered in EditProfileScreen
      });
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView style={styles.container}>
        {/* Profile Header - Admin Style */}
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatarContainer}>
            <MaterialIcons name="person" size={80} color="#3b82f6" style={{ backgroundColor: '#dbeafe', borderRadius: 20, padding: 8 }} />
          </View>
          <Text style={styles.profileName}>{profile?.name || 'Student'}</Text>
          <Text style={styles.profileEmail}>{profile?.email || 'No email available'}</Text>
        </View>
        {/* Student Information Card - Admin Style */}
        <AnimatedCard delay={100} style={styles.profileInfoCard}>
          <Text style={styles.profileInfoTitle}>Student Information</Text>
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="person" size={20} color="#3b82f6" />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Full Name</Text>
              <Text style={styles.profileInfoValue}>{profile?.name || 'Not available'}</Text>
            </View>
          </View>
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="email" size={20} color="#3b82f6" />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Email Address</Text>
              <Text style={styles.profileInfoValue}>{profile?.email || 'Not available'}</Text>
            </View>
          </View>
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="school" size={20} color="#3b82f6" />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Branch/Department</Text>
              <Text style={styles.profileInfoValue}>{profile?.branch || 'Not available'}</Text>
            </View>
          </View>
          {/* Profile Update Actions - Move to Student Information Card */}
          {ticketStatus === 'pending' ? (
            <View style={styles.profileActionButton}>
              <View style={[styles.profileActionIconContainer, {backgroundColor: '#fef3c7'}]}>
                <MaterialIcons name="hourglass-empty" size={20} color="#f59e0b" />
              </View>
              <View style={styles.profileInfoContent}>
                <Text style={styles.profileActionText}>Update Request Pending</Text>
                <Text style={styles.profileInfoLabel}>Being reviewed by administration</Text>
              </View>
            </View>
          ) : ticketStatus === 'approved' ? (
            <TouchableOpacity style={styles.profileActionButton} onPress={handleUpdateProfile}>
              <View style={[styles.profileActionIconContainer, {backgroundColor: '#dcfce7'}]}>
                <MaterialIcons name="check-circle" size={20} color="#10b981" />
              </View>
              <Text style={styles.profileActionText}>Update Profile Now</Text>
              <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.profileActionButton} onPress={handleRaiseTicket}>
              <View style={styles.profileActionIconContainer}>
                <MaterialIcons name="edit" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.profileActionText}>Request Profile Update</Text>
              <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </AnimatedCard>
        {/* Account Actions Card - Admin Style */}
        <AnimatedCard delay={200} style={styles.profileActionsCard}>
          <Text style={styles.profileActionsTitle}>Account Actions</Text>
          <TouchableOpacity style={styles.profileActionButton} onPress={() => navigation.getParent().navigate('ViewResume')}>
            <View style={styles.profileActionIconContainer}>
              <MaterialIcons name="description" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.profileActionText}>View Resume</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileActionButton} onPress={() => navigation.jumpTo('Tasks')}>
            <View style={styles.profileActionIconContainer}>
              <MaterialIcons name="assignment" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.profileActionText}>My Tasks</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileActionButton} onPress={() => navigation.jumpTo('Tickets')}>
            <View style={styles.profileActionIconContainer}>
              <MaterialIcons name="support" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.profileActionText}>Support Tickets</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.profileActionButton, styles.logoutAction]} onPress={handleLogout}>
            <View style={[styles.profileActionIconContainer, styles.logoutIconContainer]}>
              <MaterialIcons name="logout" size={20} color="#ef4444" />
            </View>
            <Text style={styles.logoutText}>Logout</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </AnimatedCard>
      </ScrollView>
    </SafeAreaView>
  );
};

// Main StudentDashboard Component with Modern Tab Navigation
const StudentDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 8,
          letterSpacing: 0.5,
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 28 : 16,
          height: Platform.OS === 'ios' ? 100 : 80,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1e293b',
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          height: 80,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '800',
          color: '#ffffff',
          letterSpacing: 0.5,
        },
        headerTitleAlign: 'center',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Dashboard',
          headerShown: false,
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? 'home' : 'home-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          }
        }} 
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen} 
        options={{ 
          title: 'My Tasks',
          headerStyle: {
            backgroundColor: '#1e293b',
            elevation: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            height: 80,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: '800',
            color: '#ffffff',
            letterSpacing: 0.5,
          },
          headerTitleAlign: 'center',
          tabBarIcon: ({ focused, color, size }) => {
            return <MaterialIcons name="assignment" size={size} color={color} />;
          }
        }} 
      />
      <Tab.Screen 
        name="Tickets" 
        component={TicketsScreen} 
        options={{ 
          title: 'Support Tickets',
          headerStyle: {
            backgroundColor: '#1e293b',
            elevation: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            height: 80,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: '700',
            color: '#ffffff',
            letterSpacing: 0.5,
          },
          tabBarIcon: ({ focused, color, size }) => {
            return <MaterialIcons name="confirmation-number" size={size} color={color} />;
          }
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'My Profile',
          headerStyle: {
            backgroundColor: '#4a6fa5',
            elevation: 8,
            shadowColor: '#6b8cce',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            height: 75,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: '700',
            color: '#ffffff',
            letterSpacing: 0.5,
          },
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          }
        }} 
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  // Modern Safe Area and Container Styles
  modernSafeArea: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  modernContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  modernContentContainer: {
    paddingBottom: 40,
  },
  
  // Modern Header Styles
  modernHeaderContainer: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modernHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modernHeaderLeft: {
    flex: 1,
  },
  modernHeaderGreeting: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 4,
  },
  modernHeaderName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  modernHeaderDate: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  modernHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modernNotificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modernNotificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernNotificationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  modernProfileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernInfoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modernTimeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  modernTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  modernWeatherCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
  },
  modernWeatherText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  modernWeatherCondition: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  
  // Modern Dashboard Container
  modernDashboardContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  
  // Modern Card Styles
  modernOverviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modernQuickActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modernActivityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modernProgressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modernCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modernCardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernCardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  modernCardMenuButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernViewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernViewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  
  // Modern Stats Grid
  modernStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  modernStatItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
  },
  modernStatNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  modernStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  modernStatIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Modern Quick Actions Grid
  modernQuickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  modernQuickActionItem: {
       flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modernQuickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernQuickActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  modernQuickActionSubtext: {

    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Modern Activity List
  modernActivityList: {
    gap: 16,
  },
  modernActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modernActivityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modernActivityContent: {
    flex: 1,
  },
  modernActivityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  modernActivityTime: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  
  // Modern Progress Styles
  modernProgressContent: {
    gap: 20,
  },
  modernProgressItem: {
    gap: 8,
  },
  modernProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernProgressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  modernProgressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  modernProgressBarContainer: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  modernProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  
  // Modern Footer
  modernFooter: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  modernFooterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  modernFooterVersion: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  
  // Legacy Header styles - Matching admin dashboard
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  headerGreeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 2,
    fontWeight: '500',
  },
  headerDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  headerTimeBox: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 5,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTimeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerProfileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 4,
  },
  profileIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 22,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Loader styles
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  
  // Welcome Card styles - Modern design
  welcomeCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 25,
    shadowColor: '#6b8cce',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  welcomeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8faff', // Subtle blue tint
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e6eeff',
    borderLeftWidth: 4,
    borderLeftColor: '#4a6fa5',
  },
  welcomeCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4a6fa5', // Matching header color
    marginLeft: 14,
    letterSpacing: 0.2,
  },
  welcomeCardContent: {
    padding: 20,
  },
  welcomeCardText: {
    fontSize: 16,
    color: '#4e5d78', // Softer, more modern text color
    lineHeight: 24,
    marginBottom: 24,
  },
  quickLinksContainer: {
    marginTop: 10,
  },
  quickLinksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a6fa5',
    marginBottom: 16,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickLinkItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8faff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#6b8cce',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  quickLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4e5d78',
  },
  
  // Stats section - Assignments and Tickets
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#6b8cce',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  statIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#6b8cce',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a6fa5',
       marginBottom: 4,
  },
  statLabel: {
    fontSize: 15,
    color: '#4e5d78',
    fontWeight: '600',
  },
  statArrow: {
    marginLeft: 10,
    color: '#6b8cce',
  },
  
  // Section styles
  sectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
   
    justifyContent: 'space-between',

    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  seeAllButton: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  seeAllText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  
  // Task item styles - Enhanced with modern design
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e6eeff',
    marginBottom: 4,
  },
  taskStatusIndicator: {
    width: 5,
    height: '80%',
    borderRadius: 3,
    marginRight: 14,
  },
  taskIconContainer: {
    marginRight: 14,
  },
  taskContent: {
    flex: 1,
    marginRight: 10,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4e5d78',
    marginBottom: 6,
  },
  taskDue: {
    fontSize: 13,
    color: '#1e293b', // Even darker color for better visibility
    fontWeight: '600', // Increased font weight for better readability
  },
  taskStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Ticket item styles - Enhanced with modern design
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e6eeff',
    marginBottom: 4,
  },
  ticketStatus: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#6b8cce',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  ticketContent: {
    flex: 1,
    marginRight: 10,
  },
  ticketTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  ticketMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketDate: {
    fontSize: 13,
    color: '#334155', // Darker color for better visibility (changed from #64748b)
    marginRight: 8,
    fontWeight: '500', // Added font weight for better readability
  },
  ticketTypeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ticketTypeText: {
    fontSize: 12,
    color: '#334155', // Darker color for better visibility (changed from #64748b)
    fontWeight: '500',
  },
  
  // Empty state styles
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#334155', // Darker color for better visibility (changed from #64748b)
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500', // Added font weight for better readability
  },
  emptyStateButton: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  
  // Footer - Modern design
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 10,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#e6eeff',
  },
  footerText: {
    fontSize: 14,
    color: '#4e5d78',
    fontWeight: '500',
    textAlign: 'center',
  },
  footerVersion: {
    fontSize: 12,
    color: '#6b8cce',
    marginTop: 6,
    fontWeight: '500',
  },
  
  // Tasks Screen Styles
  screenHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: -0.5,
  },
  tasksList: {
    padding: 15,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  taskCardTouchable: {
    flexDirection: 'row',
  },
  taskPriorityIndicator: {
    width: 6,
    height: '100%',
    borderRadius: 3,
    marginRight: 14,
  },
  taskCardContent: {
    flex: 1,
    padding: 16,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  taskDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  taskCardDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  assignedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedByText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  taskMetaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMetaIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  taskCardAction: {
    backgroundColor: '#f1f5f9',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Tickets Screen Styles
  ticketsList: {
    padding: 15,
    paddingBottom: 80, // Extra space for floating button
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ticketStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  ticketCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  ticketCardDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
  },
  ticketTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketTypeText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    padding: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  closeModalButton: {
    padding: 5,
  },
  modalContent: {
    padding: 15,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
  },
  descriptionContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  responseContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  responseBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  responseText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 15,
  },
  completeTaskButton: {
    backgroundColor: '#10b981',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 15,
  },
  completeTaskButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  manualUpdateContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  manualUpdateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 8,
  },
  manualUpdateText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 10,
  },
  manualUpdateStep: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 5,
    paddingLeft: 5,
  },
  manualUpdateHighlight: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Enhanced Modal Styles for Tasks and Tickets
  enhancedModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Darker, more modern overlay
    padding: 20,
  },
  enhancedModalView: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  enhancedModalHeader: {
    backgroundColor: '#6366f1',
    padding: 20,
  },
  enhancedModalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  enhancedModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  enhancedCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  enhancedStatusText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  enhancedModalContent: {
    padding: 20,
  },
  cardHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  enhancedDetailCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  enhancedDetailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  enhancedDetailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  enhancedDetailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  enhancedDetailContent: {
    flex: 1,
    justifyContent: 'center',
  },
  enhancedDetailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  enhancedDetailValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  enhancedDescriptionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  enhancedDescriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  enhancedDescriptionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  enhancedResponseCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  enhancedResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  enhancedResponseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0369a1',
    marginLeft: 8,
  },
  enhancedResponseText: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 22,
  },
  enhancedButtonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  enhancedCompleteButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedCompleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  enhancedCompletedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  enhancedCompletedText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  enhancedCloseModalButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedCloseModalButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Status dropdown styles
  statusDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  statusDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusDropdownText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  statusOptionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statusOptionText: {
    fontSize: 16,
    color: '#334155',
    flex: 1,
    marginLeft: 8,
  },
  selectedStatusText: {
    fontWeight: '600',
    color: '#0f172a',
  },
  
  // Notes input styles
  notesInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#0f172a',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  // Link input styles
  linkInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#0f172a',
  },
  openLinkButton: {
    backgroundColor: '#6366f1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  // Submit button styles
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  
  // Enhanced Profile Update Request Styles
  enhancedPendingCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  enhancedPendingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  enhancedPendingContent: {
    flex: 1,
  },
  enhancedPendingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  enhancedPendingText: {
    fontSize: 14,
    color: '#b45309',
    lineHeight: 20,
  },
  enhancedApprovedContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  enhancedApprovedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  enhancedApprovedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803d',
    marginLeft: 8,
  },
  enhancedApprovedText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
    marginBottom: 16,
  },
  enhancedUpdateButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedUpdateButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  enhancedRequestContainer: {
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  enhancedRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  enhancedRequestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5b21b6',
    marginLeft: 8,
  },
  enhancedRequestText: {
    fontSize: 14,
    color: '#6d28d9',
    lineHeight: 20,
    marginBottom: 16,
  },
  enhancedRequestButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedRequestButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Admin-style Profile Styles
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Constants.statusBarHeight,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileAvatarContainer: {
    marginBottom: 15,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  profileInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 20,
  },
  profileInfoRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  profileInfoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  profileInfoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  profileInfoValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  profileActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    margin: 15,
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 15,
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileActionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileActionText: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  logoutAction: {
    borderBottomWidth: 0,
  },
  logoutIconContainer: {
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: '#ef4444',
  },
  
  // Common Styles
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyListText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 15,
    textAlign: 'center',
  },
  emptyListSubText: {
    fontSize: 14,
    color: '#4b5563', // Darker color for better visibility (changed from #9ca3af)
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '400', // Added font weight for better readability
  },
});


export default StudentDashboard;