import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StatusBar,
  Dimensions,
  Platform,
  Animated,
  Easing,
  Linking
} from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';
import { IP } from '../../ip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get('window');

// Animated Card Component
const AnimatedCard = ({ children, delay = 0, style }) => {
  const translateY = new Animated.Value(50);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Home Screen Component
const HomeScreen = () => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([]);
  const [selfTasks, setSelfTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selfTaskModalVisible, setSelfTaskModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' or 'self'
  const [profile, setProfile] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetailModalVisible, setTaskDetailModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentTimeState, setCurrentTimeState] = useState('');
  const [currentDateState, setCurrentDateState] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    student_id: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'medium', // Default priority
  });
  
  const [newSelfTask, setNewSelfTask] = useState({
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'medium', // Default priority
  });

  // Initial data fetch and set up periodic refresh
  useEffect(() => {
    console.log('Faculty HomeScreen mounted, initial data fetch');
    // Initial fetch
    fetchData();
    
    // Set up interval to refresh tasks every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing tasks...');
      fetchTasks();
    }, 30000); // 30 seconds
    
    // Clean up interval on component unmount
    return () => {
      console.log('Faculty HomeScreen unmounted, clearing interval');
      clearInterval(refreshInterval);
    };
  }, []);
  
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
  
  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Faculty dashboard in focus, refreshing data...');
      fetchData();
      return () => {
        console.log('Faculty dashboard lost focus');
      };
    }, [])
  );

  const fetchData = async () => {
    console.log('Fetching all faculty dashboard data...');
    try {
      setIsLoading(true);
      
      // Check token first to avoid multiple login prompts
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        Alert.alert('Session Expired', 'Please login again');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }
      
      // Use Promise.all for parallel requests
      try {
        await Promise.all([
          fetchProfile(),
          fetchTasks('assigned'),
          fetchTasks('self'),
          fetchStudents()
        ]);
        console.log('Successfully fetched all faculty dashboard data');
      } catch (err) {
        console.error('Error in one of the fetch operations:', err);
        // Continue execution even if one request fails
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Don't show alert on every error to avoid annoying the user
      if (!refreshing) {
        Alert.alert('Error', 'Failed to load data. Please check your network connection and try again.');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      console.log('Finished fetching all faculty dashboard data');
    }
  };

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Session Expired', 'Please login again');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }
      
      const response = await axios.get(`http://${IP}:3000/api/faculty/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't throw the error, just return null
      return null;
    }
  };

  const fetchTasks = async (type = 'assigned') => {
    try {
      console.log(`Fetching latest ${type} tasks for faculty dashboard...`);
      const token = await AsyncStorage.getItem('token');
      
      // Add a timestamp parameter to prevent caching
      const response = await axios.get(`http://${IP}:3000/api/faculty/tasks?type=${type}&timestamp=${Date.now()}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      
      console.log(`Fetched ${response.data.length} ${type} tasks with statuses:`, 
        response.data.map(t => `${t.id}: ${t.status}`).join(', '));
      
      // Log the first task to check if it has a link field
      if (response.data.length > 0) {
        console.log(`First ${type} task details:`, JSON.stringify(response.data[0], null, 2));
      }
      
      if (type === 'self') {
        setSelfTasks(response.data);
      } else {
        setTasks(response.data);
      }
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} tasks:`, error);
      // Don't throw the error, just return an empty array
      if (type === 'self') {
        setSelfTasks([]);
      } else {
        setTasks([]);
      }
      return [];
    }
  };

  const fetchStudents = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`http://${IP}:3000/api/faculty/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching students:', error);
      // Don't throw the error, just return an empty array
      setStudents([]);
      return [];
    }
  };

  const onRefresh = useCallback(() => {
    console.log('Home screen refresh triggered');
    setRefreshing(true);
    // Add a small delay to ensure the refresh spinner is visible
    setTimeout(() => {
      fetchData();
    }, 100);
  }, []);

  const assignTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    if (!newTask.description.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return;
    }
    if (!newTask.student_id) {
      Alert.alert('Error', 'Please select a student to assign the task');
      return;
    }
    if (!newTask.due_date) {
      Alert.alert('Error', 'Please enter a due date');
      return;
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `http://${IP}:3000/api/faculty/assign-task`,
        {
          title: newTask.title.trim(),
          description: newTask.description.trim(),
          student_id: parseInt(newTask.student_id),
          due_date: newTask.due_date,
          priority: newTask.priority
        },
        { 
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        Alert.alert(
          'Success',
          'Task assigned successfully',
          [{ text: 'OK', onPress: () => {
            setModalVisible(false);
            setNewTask({
              title: '',
              description: '',
              student_id: '',
              due_date: new Date().toISOString().split('T')[0],
              priority: 'medium',
            });
            fetchTasks('assigned');
          }}]
        );
      }
    } catch (error) {
      console.error('Error assigning task:', error.response?.data || error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to assign task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const assignSelfTask = async () => {
    if (!newSelfTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    if (!newSelfTask.description.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return;
    }
    if (!newSelfTask.due_date) {
      Alert.alert('Error', 'Please enter a due date');
      return;
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `http://${IP}:3000/api/faculty/assign-self-task`,
        {
          title: newSelfTask.title.trim(),
          description: newSelfTask.description.trim(),
          due_date: newSelfTask.due_date,
          priority: newSelfTask.priority
        },
        { 
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        Alert.alert(
          'Success',
          'Task assigned to yourself successfully',
          [{ text: 'OK', onPress: () => {
            setSelfTaskModalVisible(false);
            setNewSelfTask({
              title: '',
              description: '',
              due_date: new Date().toISOString().split('T')[0],
              priority: 'medium',
            });
            fetchTasks('self');
          }}]
        );
      }
    } catch (error) {
      console.error('Error assigning self task:', error.response?.data || error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to assign task to yourself. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setNewTask({ ...newTask, due_date: formattedDate });
    }
  };

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { bg: '#dcfce7', text: '#16a34a', icon: 'check-circle' };
      case 'in progress':
        return { bg: '#dbeafe', text: '#3b82f6', icon: 'autorenew' };
      case 'pending':
        return { bg: '#fef9c3', text: '#ca8a04', icon: 'schedule' };
      default:
        return { bg: '#f3f4f6', text: '#64748b', icon: 'help-outline' };
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    return task.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const renderTask = ({ item, index }) => {
    const statusStyle = getStatusStyle(item.status);
    const dueDate = new Date(item.due_date);
    const isOverdue = dueDate < new Date() && item.status.toLowerCase() !== 'completed';
    
    return (
      <AnimatedCard delay={index * 100} style={styles.taskCard}>
        <TouchableOpacity 
          onPress={async () => {
            console.log('Selected task ID:', item.id);
            
            try {
              // Fetch the latest task details from the server
              const token = await AsyncStorage.getItem('token');
              const response = await axios.get(`http://${IP}:3000/api/faculty/tasks/${item.id}`, {
                headers: { 
                  Authorization: `Bearer ${token}`,
                  'Cache-Control': 'no-cache'
                }
              });
              
              console.log('Fetched task details:', JSON.stringify(response.data, null, 2));
              setSelectedTask(response.data);
            } catch (error) {
              console.error('Error fetching task details:', error);
              // Fall back to the list item data if fetch fails
              console.log('Using list data instead:', JSON.stringify(item, null, 2));
              setSelectedTask(item);
            }
            
            setTaskDetailModalVisible(true);
          }}
        >
          <View style={styles.taskCardHeader}>
            <View style={[styles.taskStatusBadge, { backgroundColor: statusStyle.bg }]}>
              <MaterialIcons name={statusStyle.icon} size={16} color={statusStyle.text} />
              <Text style={[styles.taskStatusText, { color: statusStyle.text }]}>
                {item.status}
              </Text>
            </View>
            {isOverdue && (
              <View style={styles.overdueTag}>
                <MaterialIcons name="warning" size={14} color="#ef4444" />
                <Text style={styles.overdueText}>Overdue</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.taskCardTitle}>{item.title}</Text>
          
          <Text style={styles.taskCardDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.taskCardFooter}>
            <View style={styles.taskCardInfoContainer}>
              <View style={styles.taskCardInfo}>
                <MaterialIcons name="event" size={16} color="#64748b" />
                <Text style={styles.taskCardInfoText}>
                  Due: {dueDate.toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.taskCardInfo}>
                <MaterialIcons 
                  name={activeTab === 'self' ? "person" : "school"} 
                  size={16} 
                  color="#64748b" 
                />
                <Text style={styles.taskCardInfoText}>
                  {activeTab === 'self' ? 'Self-assigned' : item.student_name}
                </Text>
              </View>
            </View>
            
            <View style={styles.taskMetaIcons}>
              {item.notes && (
                <View style={styles.taskMetaIcon}>
                  <MaterialIcons name="note" size={16} color="#0ea5e9" />
                </View>
              )}
              {item.link && (
                <View style={styles.taskMetaIcon}>
                  <MaterialIcons name="link" size={16} color="#0ea5e9" />
                </View>
              )}
              <MaterialIcons name="chevron-right" size={20} color="#0ea5e9" />
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
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
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  // Get current date for greeting
  const currentHour = new Date().getHours();
  let greeting = "Good Morning";
  if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good Afternoon";
  } else if (currentHour >= 17) {
    greeting = "Good Evening";
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting}, {profile?.name || 'Faculty'}</Text>
          <Text style={styles.subGreeting}>Manage your tasks</Text>
          <Text style={styles.currentDate}>{currentDateState}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <Text style={styles.currentTime}>{currentTimeState}</Text>
          <TouchableOpacity
            style={styles.profileIcon}
            onPress={() => navigation.jumpTo('Profile')}
          >
            <MaterialIcons name="person" size={28} color="#0ea5e9" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Task Type Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'assigned' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('assigned')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'assigned' && styles.activeTabButtonText
          ]}>
            Student Tasks
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'self' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('self')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'self' && styles.activeTabButtonText
          ]}>
            My Tasks
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <AnimatedCard delay={100} style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <MaterialIcons name="assignment" size={24} color="#0ea5e9" />
          </View>
          <Text style={styles.statValue}>{tasks.length}</Text>
          <Text style={styles.statLabel}>Total Tasks</Text>
        </AnimatedCard>
        
        <AnimatedCard delay={200} style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <MaterialIcons name="school" size={24} color="#0ea5e9" />
          </View>
          <Text style={styles.statValue}>{students.length}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </AnimatedCard>
        
        <AnimatedCard delay={300} style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <MaterialIcons name="check-circle" size={24} color="#0ea5e9" />
          </View>
          <Text style={styles.statValue}>
            {tasks.filter(task => task.status.toLowerCase() === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </AnimatedCard>
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterStatus === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'all' && styles.filterButtonTextActive
            ]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterStatus === 'pending' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('pending')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'pending' && styles.filterButtonTextActive
            ]}>Pending</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterStatus === 'in progress' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('in progress')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'in progress' && styles.filterButtonTextActive
            ]}>In Progress</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterStatus === 'completed' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('completed')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'completed' && styles.filterButtonTextActive
            ]}>Completed</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <FlatList
        data={activeTab === 'assigned' ? filteredTasks : selfTasks.filter(task => {
          if (filterStatus === 'all') return true;
          return task.status.toLowerCase() === filterStatus.toLowerCase();
        })}
        renderItem={renderTask}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.tasksList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => {
              setRefreshing(true);
              if (activeTab === 'assigned') {
                onRefresh();
              } else {
                fetchTasks('self').finally(() => setRefreshing(false));
              }
            }} 
            colors={['#0ea5e9']} 
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <MaterialIcons name="assignment" size={60} color="#d1d5db" />
            <Text style={styles.emptyListText}>
              {activeTab === 'assigned' ? 'No student tasks available' : 'No self-assigned tasks available'}
            </Text>
            <Text style={styles.emptyListSubText}>
              {filterStatus !== 'all' 
                ? `No ${filterStatus} ${activeTab === 'assigned' ? 'student' : 'self-assigned'} tasks found. Try changing the filter.` 
                : `Create a new ${activeTab === 'assigned' ? 'student' : 'self-assigned'} task by tapping the button below`}
            </Text>
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => {
          if (activeTab === 'assigned') {
            setModalVisible(true);
          } else {
            // For self-assigned tasks
            setNewSelfTask({
              title: '',
              description: '',
              due_date: new Date().toISOString().split('T')[0],
              priority: 'medium',
            });
            setSelfTaskModalVisible(true);
          }
        }}
      >
        <MaterialIcons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>
      
      {/* Task Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={taskDetailModalVisible}
        onRequestClose={() => setTaskDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            {selectedTask && (
              <ScrollView>
                <View style={styles.enhancedTaskModalHeader}>
                  <View style={styles.enhancedTaskModalTitleContainer}>
                    <MaterialIcons name="assignment" size={24} color="#ffffff" />
                    <Text style={styles.enhancedTaskModalTitle}>{selectedTask.title}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.enhancedCloseButton}
                    onPress={() => setTaskDetailModalVisible(false)}
                  >
                    <MaterialIcons name="close" size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalContent}>
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name="event" size={20} color="#0ea5e9" />
                    <Text style={styles.modalInfoText}>
                      Due Date: {new Date(selectedTask.due_date).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name="school" size={20} color="#0ea5e9" />
                    <Text style={styles.modalInfoText}>
                      Assigned To: {selectedTask.student_name}
                    </Text>
                  </View>
                  
                  {/* Status Card */}
                  <View style={styles.detailCard}>
                    <View style={styles.detailCardHeader}>
                      <MaterialIcons name="flag" size={20} color="#0ea5e9" />
                      <Text style={styles.detailCardTitle}>Status</Text>
                    </View>
                    <View style={styles.statusContainer}>
                      {(() => {
                        const statusStyle = getStatusStyle(selectedTask.status);
                        return (
                          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                            <MaterialIcons name={statusStyle.icon} size={20} color={statusStyle.text} />
                            <Text style={[styles.statusText, { color: statusStyle.text }]}>
                              {selectedTask.status}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                  </View>
                  
                  {/* Description Card */}
                  <View style={styles.detailCard}>
                    <View style={styles.detailCardHeader}>
                      <MaterialIcons name="description" size={20} color="#0ea5e9" />
                      <Text style={styles.detailCardTitle}>Description</Text>
                    </View>
                    <Text style={styles.detailCardContent}>{selectedTask.description}</Text>
                  </View>
                  
                  {/* Notes Card */}
                  <View style={styles.detailCard}>
                    <View style={styles.detailCardHeader}>
                      <MaterialIcons name="note" size={20} color="#0ea5e9" />
                      <Text style={styles.detailCardTitle}>Student Notes</Text>
                    </View>
                    {selectedTask.notes ? (
                      <Text style={styles.detailCardContent}>{selectedTask.notes}</Text>
                    ) : (
                      <Text style={styles.emptyDetailText}>No notes provided by student</Text>
                    )}
                  </View>
                  
                  {/* Link Card */}
                  <View style={styles.detailCard}>
                    <View style={styles.detailCardHeader}>
                      <MaterialIcons name="link" size={20} color="#0ea5e9" />
                      <Text style={styles.detailCardTitle}>Resource Link</Text>
                    </View>
                    {console.log('Task link value:', selectedTask.link)}
                    {console.log('Task link type:', typeof selectedTask.link)}
                    {console.log('Task link truthiness:', Boolean(selectedTask.link))}
                    {selectedTask.link && selectedTask.link !== 'null' ? (
                      <View>
                        {/* Display the full link text */}
                        <Text style={styles.linkFullText}>
                          {selectedTask.link}
                        </Text>
                        
                        {/* Clickable button to open the link */}
                        <TouchableOpacity 
                          style={styles.openLinkFullButton}
                          onPress={() => {
                            let url = selectedTask.link;
                            if (!/^https?:\/\//i.test(url)) {
                              url = 'https://' + url;
                            }
                            console.log('Opening URL:', url);
                            Linking.openURL(url).catch(err => {
                              console.error('Error opening URL:', err);
                              Alert.alert('Error', 'Could not open the link. Please check the URL.');
                            });
                          }}
                        >
                          <MaterialIcons name="open-in-new" size={20} color="#ffffff" />
                          <Text style={styles.openLinkButtonText}>Open Link</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.emptyDetailText}>No link provided by student</Text>
                    )}
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setTaskDetailModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Create Task Modal - Improved UI */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.enhancedModalContainer}>
          <View style={styles.enhancedModalView}>
            {/* Modal Header */}
            <View style={styles.enhancedModalHeader}>
              <View style={styles.enhancedModalTitleContainer}>
                <MaterialIcons name="assignment-add" size={24} color="#ffffff" />
                <Text style={styles.enhancedModalTitle}>Assign New Task</Text>
              </View>
              <TouchableOpacity
                style={styles.enhancedCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.enhancedModalContent}>
              {/* Task Title Input */}
              <View style={styles.enhancedInputGroup}>
                <Text style={styles.enhancedInputLabel}>
                  <MaterialIcons name="title" size={18} color="#0ea5e9" style={styles.enhancedInputIcon} />
                  Task Title
                </Text>
                <TextInput
                  style={styles.enhancedInput}
                  placeholder="Enter a descriptive title for the task"
                  placeholderTextColor="#94a3b8"
                  value={newTask.title}
                  onChangeText={(text) => setNewTask({ ...newTask, title: text })}
                />
              </View>
              
              {/* Task Description Input */}
              <View style={styles.enhancedInputGroup}>
                <Text style={styles.enhancedInputLabel}>
                  <MaterialIcons name="description" size={18} color="#0ea5e9" style={styles.enhancedInputIcon} />
                  Task Description
                </Text>
                <TextInput
                  style={[styles.enhancedInput, styles.enhancedTextArea]}
                  placeholder="Provide detailed instructions for the task"
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  value={newTask.description}
                  onChangeText={(text) => setNewTask({ ...newTask, description: text })}
                />
              </View>
              
              {/* Due Date Picker */}
              <View style={styles.enhancedInputGroup}>
                <Text style={styles.enhancedInputLabel}>
                  <MaterialIcons name="event" size={18} color="#0ea5e9" style={styles.enhancedInputIcon} />
                  Due Date
                </Text>
                <TouchableOpacity
                  style={styles.enhancedDatePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.enhancedDatePickerButtonText}>
                    {newTask.due_date || 'Select due date'}
                  </Text>
                  <MaterialIcons name="calendar-today" size={20} color="#0ea5e9" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(newTask.due_date)}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>
              
              {/* Student Selection */}
              <View style={styles.enhancedInputGroup}>
                <Text style={styles.enhancedInputLabel}>
                  <MaterialIcons name="person" size={18} color="#0ea5e9" style={styles.enhancedInputIcon} />
                  Assign To
                </Text>
                <View style={styles.enhancedPickerContainer}>
                  <Picker
                    selectedValue={newTask.student_id}
                    onValueChange={(itemValue) =>
                      setNewTask({ ...newTask, student_id: itemValue })
                    }
                    style={styles.enhancedPicker}
                  >
                    <Picker.Item label="Select Student" value="" />
                    {students.map((student) => (
                      <Picker.Item
                        key={student.id}
                        label={student.name}
                        value={student.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              
              {/* Priority Selection */}
              <View style={styles.enhancedInputGroup}>
                <Text style={styles.enhancedInputLabel}>
                  <MaterialIcons name="flag" size={18} color="#0ea5e9" style={styles.enhancedInputIcon} />
                  Priority
                </Text>
                <View style={styles.priorityOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.priorityOption, 
                      styles.lowPriority,
                      newTask.priority === 'low' && styles.selectedPriority
                    ]}
                    onPress={() => setNewTask({ ...newTask, priority: 'low' })}
                  >
                    <MaterialIcons 
                      name={newTask.priority === 'low' ? "radio-button-checked" : "radio-button-unchecked"} 
                      size={18} 
                      color="#10b981" 
                    />
                    <Text style={styles.priorityText}>Low</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.priorityOption, 
                      styles.mediumPriority,
                      newTask.priority === 'medium' && styles.selectedPriority
                    ]}
                    onPress={() => setNewTask({ ...newTask, priority: 'medium' })}
                  >
                    <MaterialIcons 
                      name={newTask.priority === 'medium' ? "radio-button-checked" : "radio-button-unchecked"} 
                      size={18} 
                      color="#f59e0b" 
                    />
                    <Text style={styles.priorityText}>Medium</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.priorityOption, 
                      styles.highPriority,
                      newTask.priority === 'high' && styles.selectedPriority
                    ]}
                    onPress={() => setNewTask({ ...newTask, priority: 'high' })}
                  >
                    <MaterialIcons 
                      name={newTask.priority === 'high' ? "radio-button-checked" : "radio-button-unchecked"} 
                      size={18} 
                      color="#ef4444" 
                    />
                    <Text style={styles.priorityText}>High</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.enhancedButtonsContainer}>
                <TouchableOpacity
                  style={styles.enhancedCancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <MaterialIcons name="close" size={20} color="#64748b" />
                  <Text style={styles.enhancedCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.enhancedSubmitButton}
                  onPress={assignTask}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialIcons name="assignment-turned-in" size={20} color="#ffffff" />
                      <Text style={styles.enhancedSubmitButtonText}>Assign Task</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Self Task Modal - Modern UI */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selfTaskModalVisible}
        onRequestClose={() => setSelfTaskModalVisible(false)}
      >
        <View style={styles.selfTaskModalContainer}>
          <View style={styles.selfTaskModalView}>
            {/* Modal Header */}
            <View style={styles.selfTaskModalHeader}>
              <View style={styles.selfTaskModalTitleContainer}>
                <MaterialIcons name="assignment-ind" size={28} color="#ffffff" />
                <Text style={styles.selfTaskModalTitle}>Personal Task</Text>
              </View>
              <TouchableOpacity
                style={styles.selfTaskCloseButton}
                onPress={() => setSelfTaskModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.selfTaskModalContent}>
              {/* Task Title Input with Floating Label */}
              <View style={styles.selfTaskInputGroup}>
                <View style={styles.selfTaskInputIconContainer}>
                  <MaterialIcons name="title" size={22} color="#3b82f6" />
                </View>
                <View style={styles.selfTaskInputWrapper}>
                  <Text style={styles.selfTaskInputLabel}>Task Title</Text>
                  <TextInput
                    style={styles.selfTaskInput}
                    placeholder="What do you need to accomplish?"
                    placeholderTextColor="#94a3b8"
                    value={newSelfTask.title}
                    onChangeText={(text) => setNewSelfTask({...newSelfTask, title: text})}
                  />
                </View>
              </View>
              
              {/* Task Description Input */}
              <View style={styles.selfTaskInputGroup}>
                <View style={styles.selfTaskInputIconContainer}>
                  <MaterialIcons name="description" size={22} color="#3b82f6" />
                </View>
                <View style={styles.selfTaskInputWrapper}>
                  <Text style={styles.selfTaskInputLabel}>Description</Text>
                  <TextInput
                    style={[styles.selfTaskInput, styles.selfTaskTextArea]}
                    placeholder="Add details about this task..."
                    placeholderTextColor="#94a3b8"
                    multiline={true}
                    numberOfLines={4}
                    value={newSelfTask.description}
                    onChangeText={(text) => setNewSelfTask({...newSelfTask, description: text})}
                  />
                </View>
              </View>
              
              {/* Due Date Input with Calendar Icon */}
              <View style={styles.selfTaskInputGroup}>
                <View style={styles.selfTaskInputIconContainer}>
                  <MaterialIcons name="event" size={22} color="#3b82f6" />
                </View>
                <View style={styles.selfTaskInputWrapper}>
                  <Text style={styles.selfTaskInputLabel}>Due Date</Text>
                  <TouchableOpacity
                    style={styles.selfTaskDateInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.selfTaskDateText}>
                      {new Date(newSelfTask.due_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                    <MaterialIcons name="calendar-today" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Priority Selection with Modern UI */}
              <View style={styles.selfTaskInputGroup}>
                <View style={styles.selfTaskInputIconContainer}>
                  <MaterialIcons name="flag" size={22} color="#3b82f6" />
                </View>
                <View style={styles.selfTaskInputWrapper}>
                  <Text style={styles.selfTaskInputLabel}>Priority Level</Text>
                  <View style={styles.selfTaskPriorityContainer}>
                    <TouchableOpacity
                      style={[
                        styles.selfTaskPriorityButton,
                        newSelfTask.priority === 'low' && styles.selfTaskPriorityButtonLow
                      ]}
                      onPress={() => setNewSelfTask({...newSelfTask, priority: 'low'})}
                    >
                      <MaterialIcons 
                        name="flag" 
                        size={20} 
                        color={newSelfTask.priority === 'low' ? '#10b981' : '#94a3b8'} 
                      />
                      <Text style={[
                        styles.selfTaskPriorityText,
                        newSelfTask.priority === 'low' && styles.selfTaskPriorityTextLow
                      ]}>Low</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.selfTaskPriorityButton,
                        newSelfTask.priority === 'medium' && styles.selfTaskPriorityButtonMedium
                      ]}
                      onPress={() => setNewSelfTask({...newSelfTask, priority: 'medium'})}
                    >
                      <MaterialIcons 
                        name="flag" 
                        size={20} 
                        color={newSelfTask.priority === 'medium' ? '#0ea5e9' : '#94a3b8'} 
                      />
                      <Text style={[
                        styles.selfTaskPriorityText,
                        newSelfTask.priority === 'medium' && styles.selfTaskPriorityTextMedium
                      ]}>Medium</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.selfTaskPriorityButton,
                        newSelfTask.priority === 'high' && styles.selfTaskPriorityButtonHigh
                      ]}
                      onPress={() => setNewSelfTask({...newSelfTask, priority: 'high'})}
                    >
                      <MaterialIcons 
                        name="flag" 
                        size={20} 
                        color={newSelfTask.priority === 'high' ? '#ef4444' : '#94a3b8'} 
                      />
                      <Text style={[
                        styles.selfTaskPriorityText,
                        newSelfTask.priority === 'high' && styles.selfTaskPriorityTextHigh
                      ]}>High</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              {/* Action Buttons with Gradient */}
              <View style={styles.selfTaskButtonsContainer}>
                <TouchableOpacity
                  style={styles.selfTaskCancelButton}
                  onPress={() => setSelfTaskModalVisible(false)}
                >
                  <MaterialIcons name="close" size={20} color="#64748b" />
                  <Text style={styles.selfTaskCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.selfTaskSubmitButton}
                  onPress={assignSelfTask}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={20} color="#ffffff" />
                      <Text style={styles.selfTaskSubmitButtonText}>Create Task</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Self Task Modal Styles - Modern UI
  selfTaskModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Darker overlay for better contrast
    padding: 20,
  },
  selfTaskModalView: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  selfTaskModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0ea5e9',
  },
  selfTaskModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selfTaskModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
  },
  selfTaskCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfTaskModalContent: {
    padding: 24,
  },
  selfTaskInputGroup: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  selfTaskInputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  selfTaskInputWrapper: {
    flex: 1,
  },
  selfTaskInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  selfTaskInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  selfTaskTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selfTaskDateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  selfTaskDateText: {
    fontSize: 16,
    color: '#0f172a',
  },
  selfTaskPriorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selfTaskPriorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    flex: 1,
    marginHorizontal: 4,
  },
  selfTaskPriorityButtonLow: {
    backgroundColor: '#e2f8f0',
    borderColor: '#10b981',
  },
  selfTaskPriorityButtonMedium: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
  },
  selfTaskPriorityButtonHigh: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  selfTaskPriorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  selfTaskPriorityTextLow: {
    color: '#10b981',
  },
  selfTaskPriorityTextMedium: {
    color: '#0ea5e9',
  },
  selfTaskPriorityTextHigh: {
    color: '#ef4444',
  },
  selfTaskButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  selfTaskCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  selfTaskCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 8,
  },
  selfTaskSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  selfTaskSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#0ea5e9',
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabButtonText: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc', // Lighter background for a cleaner look
    paddingTop: Constants.statusBarHeight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  currentDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  currentTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  profileIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#bae6fd',
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  filterContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  tasksList: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 80,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  taskStatusText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 5,
  },
  overdueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  overdueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 5,
  },
  taskCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  taskCardDescription: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    marginTop: 2,
  },
  taskCardInfoContainer: {
    flexDirection: 'column',
  },
  taskCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 4,
  },
  taskCardInfoText: {
    fontSize: 12,
    color: '#1e293b', // Darker color for better visibility
    marginLeft: 4,
    fontWeight: '500', // Added font weight for better readability
  },
  taskMetaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMetaIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyListText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1e293b', // Darker color for better visibility
    marginTop: 15,
    textAlign: 'center',
  },
  emptyListSubText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
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
    borderBottomColor: '#f1f5f9',
    padding: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  enhancedTaskModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 16,
  },
  enhancedTaskModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  enhancedTaskModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
    flex: 1,
  },
  closeModalButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    marginLeft: 8,
    fontWeight: '500', // Added font weight for better readability
  },
  descriptionContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    lineHeight: 20,
    fontWeight: '400', // Added font weight for better readability
  },
  
  // Detail card styles
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 8,
  },
  detailCardContent: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  emptyDetailText: {
    fontSize: 15,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  
  // Status styles
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Link styles
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  linkTextContainer: {
    flex: 1,
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 15,
    color: '#0369a1',
    marginRight: 8,
    textDecorationLine: 'underline',
  },
  linkFullText: {
    fontSize: 16,
    color: '#0369a1',
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    overflow: 'hidden',
  },
  openLinkFullButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  openLinkButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  openLinkButton: {
    backgroundColor: '#0ea5e9',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalButton: {
    backgroundColor: '#0ea5e9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 15,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#0f172a',
  },
  pickerContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#0f172a',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Enhanced Modal Styles
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#0ea5e9',
  },
  enhancedModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enhancedModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 10,
  },
  enhancedCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedModalContent: {
    padding: 20,
  },
  enhancedInputGroup: {
    marginBottom: 20,
  },
  enhancedInputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  enhancedInputIcon: {
    marginRight: 6,
  },
  enhancedInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  enhancedTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  enhancedDatePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  enhancedDatePickerButtonText: {
    fontSize: 15,
    color: '#0f172a',
  },
  enhancedPickerContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  enhancedPicker: {
    height: 50,
    color: '#0f172a',
  },
  priorityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'center',
  },
  lowPriority: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  mediumPriority: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  highPriority: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  selectedPriority: {
    borderColor: '#0ea5e9',
    borderWidth: 2,
  },
  priorityText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  enhancedButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  enhancedCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    flex: 1,
    marginRight: 10,
  },
  enhancedCancelButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  enhancedSubmitButton: {
    flexDirection: 'row',
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  enhancedSubmitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Profile screen styles
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#1e293b', // Darker color for better visibility
    fontWeight: '500', // Added font weight for better readability
  },
  profileInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfoContent: {
    flex: 1,
  },
  profileInfoLabel: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    marginBottom: 2,
    fontWeight: '500', // Added font weight for better readability
  },
  profileInfoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  profileActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileActionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileActionText: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  logoutAction: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  logoutIconContainer: {
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: '#ef4444',
  },
});

// Profile Screen Component
const ProfileScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Faculty profile screen in focus, refreshing data...');
      fetchProfile();
      return () => {
        // Cleanup function when screen loses focus
        console.log('Faculty profile screen lost focus');
      };
    }, [])
  );

  const fetchProfile = async () => {
    console.log('Fetching faculty profile data...');
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        Alert.alert('Session Expired', 'Please login again');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return null;
      }
      
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await axios.get(`http://${IP}:3000/api/faculty/profile?timestamp=${timestamp}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      
      console.log('Profile data fetched successfully');
      setProfile(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't show alert on every error to avoid annoying the user
      if (!refreshing) {
        Alert.alert('Error', 'Failed to fetch profile. Please check your network connection and try again.');
      }
      return null;
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      console.log('Finished fetching faculty profile data');
    }
  };

  const onRefresh = useCallback(() => {
    console.log('Profile screen refresh triggered');
    setRefreshing(true);
    // Create a proper fetchData function for the profile screen
    const fetchData = async () => {
      try {
        await fetchProfile();
      } catch (error) {
        console.error('Error refreshing profile:', error);
      } finally {
        setRefreshing(false);
      }
    };
    fetchData();
  }, []);

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
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />
        }
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatarContainer}>
            <MaterialIcons name="school" size={80} color="#0ea5e9" />
          </View>
          <Text style={styles.profileName}>{profile?.name || 'Faculty'}</Text>
          <Text style={styles.profileEmail}>{profile?.email || 'No email available'}</Text>
        </View>
        
        <AnimatedCard delay={100} style={styles.profileInfoCard}>
          <Text style={styles.profileInfoTitle}>Faculty Information</Text>
          
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="badge" size={20} color="#0ea5e9" />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Faculty ID</Text>
              <Text style={styles.profileInfoValue}>{profile?.id || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="person" size={20} color="#0ea5e9" />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Full Name</Text>
              <Text style={styles.profileInfoValue}>{profile?.name || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="email" size={20} color="#0ea5e9" />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Email Address</Text>
              <Text style={styles.profileInfoValue}>{profile?.email || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="school" size={20} color="#0ea5e9" />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Branch</Text>
              <Text style={styles.profileInfoValue}>{profile?.branch || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="event" size={20} color="#0ea5e9" />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Account Created</Text>
              <Text style={styles.profileInfoValue}>
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString() 
                  : 'Not available'}
              </Text>
            </View>
          </View>
          
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconContainer}>
              <MaterialIcons name="update" size={20} color="#0ea5e9" />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Last Updated</Text>
              <Text style={styles.profileInfoValue}>
                {profile?.updated_at 
                  ? new Date(profile.updated_at).toLocaleDateString() 
                  : 'Not available'}
              </Text>
            </View>
          </View>
        </AnimatedCard>
        
        <AnimatedCard delay={200} style={styles.profileActionsCard}>
          <Text style={styles.profileActionsTitle}>Account Actions</Text>
          
          <TouchableOpacity 
            style={styles.profileActionButton}
            onPress={() => navigation.jumpTo('Home')}
          >
            <View style={styles.profileActionIconContainer}>
              <MaterialIcons name="dashboard" size={20} color="#0ea5e9" />
            </View>
            <Text style={styles.profileActionText}>Dashboard</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.profileActionButton, styles.logoutAction]}
            onPress={handleLogout}
          >
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

// Main FacultyDashboard Component
const FacultyDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'My Tasks') {
            iconName = focused ? 'list' : 'list-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          height: Platform.OS === 'ios' ? 90 : 70,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'Dashboard',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

export default FacultyDashboard;

