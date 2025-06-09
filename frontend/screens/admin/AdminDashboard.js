import React, { useState, useEffect, useCallback } from 'react';
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
  SectionList,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Dimensions,
  Platform,
  Animated,
  Easing,
  TextInput
} from 'react-native';
import Constants from 'expo-constants';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { IP } from '../../ip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

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
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    tasks: 0,
    tickets: 0,
    pendingTickets: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTimeState, setCurrentTimeState] = useState('');
  const [currentDateState, setCurrentDateState] = useState('');
  
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

  const fetchDashboardData = async (isManualRefresh = false) => {
    //console.log('Fetching admin dashboard data...');
    try {
      if (!isManualRefresh) setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        //console.log('No token found, redirecting to login');
        Alert.alert('Session Expired', 'Please login again');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };

      // Use Promise.all to fetch data in parallel
      const [usersResponse, tasksResponse, ticketsResponse] = await Promise.all([
        // Fetch users
        axios.get(`http://${IP}:3000/api/admin/users?timestamp=${timestamp}`, { headers }),
        
        // Fetch tasks
        axios.get(`http://${IP}:3000/api/admin/tasks?timestamp=${timestamp}`, { headers }),
        
        // Fetch tickets
        axios.get(`http://${IP}:3000/api/admin/tickets?timestamp=${timestamp}`, { headers })
      ]);
      
      //console.log(`Fetched data: ${usersResponse.data.students.length} students, ${usersResponse.data.faculty.length} faculty, ${tasksResponse.data.length} tasks, ${ticketsResponse.data.length} tickets`);
      
      // Calculate stats
      const pendingTickets = ticketsResponse.data.filter(ticket => 
        ticket.status === 'pending'
      ).length;
      
      setStats({
        students: usersResponse.data.students.length,
        faculty: usersResponse.data.faculty.length,
        tasks: tasksResponse.data.length,
        tickets: ticketsResponse.data.length,
        pendingTickets
      });
    } catch (error) {
      //console.error('Error fetching dashboard data:', error);
      // Don't show alert on every error to avoid annoying the user
      if (!refreshing) {
        Alert.alert(
          'Data Retrieval Error', 
          'Unable to load administrative dashboard data. Please check your network connection and try again.'
        );
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      //console.log('Finished fetching admin dashboard data');
    }
  };

  const onRefresh = useCallback(() => {
    //console.log('Manual refresh triggered');
    setRefreshing(true);
    setTimeout(() => {
      fetchDashboardData(true); // Pass true to indicate manual refresh
    }, 100);
  }, []);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      return () => {};
    }, [])
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting}, Administrator</Text>
            <Text style={styles.subGreeting}>Academic Management & Student Services</Text>
            <Text style={styles.currentDate}>{currentDateState}</Text>
          </View>
          
          <View style={styles.headerRight}>
            <Text style={styles.currentTime}>{currentTimeState}</Text>
            <TouchableOpacity
              style={styles.profileIcon}
              onPress={() => navigation.navigate('Profile')}
            >
              <MaterialIcons name="admin-panel-settings" size={40} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <AnimatedCard delay={100} style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
              <MaterialIcons name="school" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>{stats.students}</Text>
            <Text style={styles.statLabel}>Enrolled Students</Text>
          </AnimatedCard>
          
          <AnimatedCard delay={200} style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#e0f2fe' }]}>
              <MaterialIcons name="school" size={24} color="#0ea5e9" />
            </View>
            <Text style={styles.statValue}>{stats.faculty}</Text>
            <Text style={styles.statLabel}>Faculty Members</Text>
          </AnimatedCard>
          
          <AnimatedCard delay={300} style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#f0fdf4' }]}>
              <MaterialIcons name="assignment" size={24} color="#22c55e" />
            </View>
            <Text style={styles.statValue}>{stats.tasks}</Text>
            <Text style={styles.statLabel}>Academic Tasks</Text>
          </AnimatedCard>
        </View>

        <View style={styles.statsContainer}>
          <AnimatedCard delay={400} style={[styles.statCard, { width: '48%' }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fef9c3' }]}>
              <MaterialIcons name="help" size={24} color="#eab308" />
            </View>
            <Text style={styles.statValue}>{stats.tickets}</Text>
            <Text style={styles.statLabel}>Student Requests</Text>
          </AnimatedCard>
          
          <AnimatedCard delay={500} style={[styles.statCard, { width: '48%' }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#ffedd5' }]}>
              <MaterialIcons name="hourglass-empty" size={24} color="#f97316" />
            </View>
            <Text style={styles.statValue}>{stats.pendingTickets}</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </AnimatedCard>
        </View>

        {/* Quick Actions */}
        <AnimatedCard delay={600} style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>University Management</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Users')}
            >
              <View style={styles.actionIconContainer}>
                <MaterialIcons name="groups" size={24} color="#ffffff" />
              </View>
              <Text style={styles.actionText}>Campus Directory</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Tasks')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#22c55e' }]}>
                <MaterialIcons name="assignment" size={24} color="#ffffff" />
              </View>
              <Text style={styles.actionText}>Academic Tasks</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Tickets')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#f97316' }]}>
                <MaterialIcons name="help" size={24} color="#ffffff" />
              </View>
              <Text style={styles.actionText}>Student Services</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={async () => {
                await AsyncStorage.removeItem('token');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#ef4444' }]}>
                <MaterialIcons name="logout" size={24} color="#ffffff" />
              </View>
              <Text style={styles.actionText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>
      </ScrollView>
    </SafeAreaView>
  );
};

// Users Screen Component
const UsersScreen = () => {
  const [users, setUsers] = useState({ students: [], faculty: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'students', 'faculty'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'branch'

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
      return () => {};
    }, [])
  );

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`http://${IP}:3000/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      //console.error('Error fetching users:', error);
      Alert.alert('Directory Error', 'Unable to retrieve university personnel directory. Please try again later or contact IT support.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, []);

  const handleUserPress = (user, section) => {
    setSelectedUser({...user, userType: section.title.toLowerCase()});
    setModalVisible(true);
  };

  // Sort users based on the selected sort criteria
  const sortUsers = (data) => {
    return [...data].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'branch') {
        return (a.branch || '').localeCompare(b.branch || '');
      }
      return 0;
    });
  };

  // Filter users based on search query
  const filterBySearch = (item) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      (item.branch && item.branch.toLowerCase().includes(query))
    );
  };

  const renderUser = ({ item, section, index }) => {
    // Skip if it doesn't match the search query
    if (!filterBySearch(item)) return null;
    
    // Skip if it doesn't match the active tab
    if (activeTab === 'students' && section.title !== 'Students') return null;
    if (activeTab === 'faculty' && section.title !== 'Faculty') return null;

    // Determine colors based on user type
    const isStudent = section.title === 'Students';
    const colors = {
      bg: isStudent ? '#dbeafe' : '#e0f2fe',
      text: isStudent ? '#3b82f6' : '#0ea5e9',
      icon: isStudent ? '#3b82f6' : '#0ea5e9',
      statusBg: isStudent && item.profile_edit ? '#fff7ed' : '#f0fdf4',
      statusText: isStudent && item.profile_edit ? '#ea580c' : '#16a34a',
      statusIcon: isStudent && item.profile_edit ? 'hourglass-empty' : 'check-circle',
    };

    return (
      <AnimatedCard delay={index * 50} style={styles.enhancedUserCard}>
        <TouchableOpacity 
          onPress={() => handleUserPress(item, section)}
          style={styles.enhancedUserCardContent}
          activeOpacity={0.7}
        >
          <View style={[styles.enhancedUserAvatar, { backgroundColor: colors.bg }]}>
            <Text style={[styles.enhancedUserAvatarText, { color: colors.text }]}>
              {item.name?.[0] || '?'}
            </Text>
          </View>
          
          <View style={styles.enhancedUserInfo}>
            <View style={styles.enhancedUserHeader}>
              <Text style={styles.enhancedUserName}>{item.name}</Text>
              
              {isStudent && (
                <View style={[styles.enhancedUserBadge, { backgroundColor: colors.statusBg }]}>
                  <MaterialIcons name={colors.statusIcon} size={12} color={colors.statusText} />
                  <Text style={[styles.enhancedUserBadgeText, { color: colors.statusText }]}>
                    {item.profile_edit ? 'Edit Pending' : 'Verified'}
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.enhancedUserEmail}>{item.email}</Text>
            
            <View style={styles.enhancedUserMeta}>
              <View style={styles.enhancedUserMetaItem}>
                <MaterialIcons name="school" size={14} color="#64748b" />
                <Text style={styles.enhancedUserMetaText}>
                  {item.branch || 'No Branch'}
                </Text>
              </View>
              
              <View style={styles.enhancedUserMetaItem}>
                <MaterialIcons 
                  name={isStudent ? "person" : "person-pin"} 
                  size={14} 
                  color="#64748b" 
                />
                <Text style={styles.enhancedUserMetaText}>
                  {isStudent ? "Student" : "Faculty"}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.enhancedUserAction}>
            <MaterialIcons name="chevron-right" size={24} color="#cbd5e1" />
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  // Prepare sections based on the active tab and sort criteria
  const getSections = () => {
    const sections = [];
    
    if (activeTab === 'all' || activeTab === 'students') {
      sections.push({ 
        title: 'Students', 
        data: sortUsers(users.students || []).filter(filterBySearch)
      });
    }
    
    if (activeTab === 'all' || activeTab === 'faculty') {
      sections.push({ 
        title: 'Faculty', 
        data: sortUsers(users.faculty || []).filter(filterBySearch)
      });
    }
    
    return sections;
  };

  // Get total count of filtered users
  const getTotalCount = () => {
    const sections = getSections();
    return sections.reduce((total, section) => total + section.data.length, 0);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Enhanced Header with Search */}
      <View style={styles.enhancedScreenHeader}>
        <View style={styles.enhancedHeaderTop}>
          <Text style={styles.enhancedScreenTitle}>Campus Directory</Text>
          <View style={styles.enhancedHeaderStats}>
            <View style={styles.enhancedStatBadge}>
              <Text style={styles.enhancedStatBadgeText}>
                {users.students?.length || 0} Students
              </Text>
            </View>
            <View style={styles.enhancedStatBadge}>
              <Text style={styles.enhancedStatBadgeText}>
                {users.faculty?.length || 0} Faculty
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.enhancedSearchContainer}>
          <MaterialIcons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.enhancedSearchInput}
            placeholder="Search by name, email, or department..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.enhancedSearchClear}
            >
              <MaterialIcons name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Filter Tabs */}
        <View style={styles.enhancedFilterTabs}>
          <TouchableOpacity
            style={[
              styles.enhancedFilterTab,
              activeTab === 'all' && styles.enhancedFilterTabActive
            ]}
            onPress={() => setActiveTab('all')}
          >
            <MaterialIcons 
              name="people" 
              size={16} 
              color={activeTab === 'all' ? "#3b82f6" : "#64748b"} 
            />
            <Text style={[
              styles.enhancedFilterTabText,
              activeTab === 'all' && styles.enhancedFilterTabTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.enhancedFilterTab,
              activeTab === 'students' && styles.enhancedFilterTabActive
            ]}
            onPress={() => setActiveTab('students')}
          >
            <MaterialIcons 
              name="school" 
              size={16} 
              color={activeTab === 'students' ? "#3b82f6" : "#64748b"} 
            />
            <Text style={[
              styles.enhancedFilterTabText,
              activeTab === 'students' && styles.enhancedFilterTabTextActive
            ]}>
              Students
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.enhancedFilterTab,
              activeTab === 'faculty' && styles.enhancedFilterTabActive
            ]}
            onPress={() => setActiveTab('faculty')}
          >
            <MaterialIcons 
              name="person-pin" 
              size={16} 
              color={activeTab === 'faculty' ? "#3b82f6" : "#64748b"} 
            />
            <Text style={[
              styles.enhancedFilterTabText,
              activeTab === 'faculty' && styles.enhancedFilterTabTextActive
            ]}>
              Faculty
            </Text>
          </TouchableOpacity>
          
          {/* Sort Options */}
          <View style={styles.enhancedSortContainer}>
            <Text style={styles.enhancedSortLabel}>Sort:</Text>
            <TouchableOpacity
              style={styles.enhancedSortButton}
              onPress={() => setSortBy(sortBy === 'name' ? 'branch' : 'name')}
            >
              <Text style={styles.enhancedSortButtonText}>
                {sortBy === 'name' ? 'Name' : 'Branch'}
              </Text>
              <MaterialIcons 
                name={sortBy === 'name' ? "arrow-downward" : "sort"} 
                size={14} 
                color="#3b82f6" 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Results Count */}
        {searchQuery && (
          <View style={styles.enhancedResultsCount}>
            <Text style={styles.enhancedResultsCountText}>
              Found {getTotalCount()} results for "{searchQuery}"
            </Text>
          </View>
        )}
      </View>
      
      {/* User List */}
      {isLoading && !refreshing ? (
        <View style={styles.enhancedLoaderContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.enhancedLoaderText}>Loading directory...</Text>
        </View>
      ) : (
        <SectionList
          sections={getSections()}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderUser}
          renderSectionHeader={({ section: { title, data } }) => (
            data.length > 0 ? (
              <View style={styles.enhancedSectionHeader}>
                <View style={styles.enhancedSectionHeaderLeft}>
                  <MaterialIcons 
                    name={title === 'Students' ? "school" : "person-pin"} 
                    size={18} 
                    color="#3b82f6" 
                  />
                  <Text style={styles.enhancedSectionTitle}>{title}</Text>
                </View>
                <View style={styles.enhancedSectionCount}>
                  <Text style={styles.enhancedSectionCountText}>
                    {data.length}
                  </Text>
                </View>
              </View>
            ) : null
          )}
          ListEmptyComponent={
            <View style={styles.enhancedEmptyContainer}>
              <MaterialIcons name="search-off" size={60} color="#cbd5e1" />
              <Text style={styles.enhancedEmptyTitle}>
                {searchQuery ? 'No matching results' : 'No users available'}
              </Text>
              <Text style={styles.enhancedEmptySubtitle}>
                {searchQuery 
                  ? 'Try adjusting your search or filters'
                  : 'Users will appear here once they are added to the system'
                }
              </Text>
              {searchQuery && (
                <TouchableOpacity
                  style={styles.enhancedEmptyButton}
                  onPress={() => {
                    setSearchQuery('');
                    setActiveTab('all');
                  }}
                >
                  <Text style={styles.enhancedEmptyButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#3b82f6']} 
              tintColor="#3b82f6"
            />
          }
          contentContainerStyle={styles.enhancedSectionListContent}
          stickySectionHeadersEnabled={true}
        />
      )}
      
      {/* Enhanced User Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.enhancedModalContainer}>
          <View style={styles.enhancedModalView}>
            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Modal Header with Close Button */}
                <View style={styles.enhancedModalHeader}>
                  <TouchableOpacity
                    style={styles.enhancedModalClose}
                    onPress={() => setModalVisible(false)}
                  >
                    <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.enhancedModalTitle}>User Profile</Text>
                  <View style={{width: 24}} />
                </View>
                
                {/* User Profile Header */}
                <View style={styles.enhancedUserProfileHeader}>
                  <View style={[
                    styles.enhancedUserProfileAvatar,
                    { 
                      backgroundColor: selectedUser.userType === 'students' 
                        ? '#dbeafe' 
                        : '#e0f2fe' 
                    }
                  ]}>
                    <Text style={[
                      styles.enhancedUserProfileAvatarText,
                      { 
                        color: selectedUser.userType === 'students' 
                          ? '#3b82f6' 
                          : '#0ea5e9' 
                      }
                    ]}>
                      {selectedUser.name?.[0] || '?'}
                    </Text>
                  </View>
                  
                  <Text style={styles.enhancedUserProfileName}>
                    {selectedUser.name}
                  </Text>
                  
                  <View style={[
                    styles.enhancedUserProfileBadge,
                    { 
                      backgroundColor: selectedUser.userType === 'students' 
                        ? '#dbeafe' 
                        : '#e0f2fe' 
                    }
                  ]}>
                    <MaterialIcons 
                      name={selectedUser.userType === 'students' ? "school" : "person-pin"} 
                      size={14} 
                      color={selectedUser.userType === 'students' ? "#3b82f6" : "#0ea5e9"} 
                    />
                    <Text style={[
                      styles.enhancedUserProfileBadgeText,
                      { 
                        color: selectedUser.userType === 'students' 
                          ? '#3b82f6' 
                          : '#0ea5e9' 
                      }
                    ]}>
                      {selectedUser.userType === 'students' ? 'Student' : 'Faculty'}
                    </Text>
                  </View>
                </View>
                
                {/* Contact Information Card */}
                <View style={styles.enhancedUserProfileCard}>
                  <View style={styles.enhancedUserProfileCardHeader}>
                    <MaterialIcons name="contact-mail" size={20} color="#3b82f6" />
                    <Text style={styles.enhancedUserProfileCardTitle}>
                      Contact Information
                    </Text>
                  </View>
                  
                  <View style={styles.enhancedUserProfileCardContent}>
                    <View style={styles.enhancedUserProfileItem}>
                      <View style={styles.enhancedUserProfileItemIcon}>
                        <MaterialIcons name="email" size={20} color="#64748b" />
                      </View>
                      <View style={styles.enhancedUserProfileItemContent}>
                        <Text style={styles.enhancedUserProfileItemLabel}>Email Address</Text>
                        <Text style={styles.enhancedUserProfileItemValue}>
                          {selectedUser.email}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.enhancedUserProfileDivider} />
                    
                    <View style={styles.enhancedUserProfileItem}>
                      <View style={styles.enhancedUserProfileItemIcon}>
                        <MaterialIcons name="business" size={20} color="#64748b" />
                      </View>
                      <View style={styles.enhancedUserProfileItemContent}>
                        <Text style={styles.enhancedUserProfileItemLabel}>Department/Branch</Text>
                        <Text style={styles.enhancedUserProfileItemValue}>
                          {selectedUser.branch || 'Not specified'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                {/* Profile Status Card (Students Only) */}
                {selectedUser.userType === 'students' && (
                  <View style={styles.enhancedUserProfileCard}>
                    <View style={styles.enhancedUserProfileCardHeader}>
                      <MaterialIcons name="verified-user" size={20} color="#3b82f6" />
                      <Text style={styles.enhancedUserProfileCardTitle}>
                        Profile Status
                      </Text>
                    </View>
                    
                    <View style={[
                      styles.enhancedUserProfileStatusCard,
                      selectedUser.profile_edit 
                        ? styles.enhancedUserProfileStatusPending 
                        : styles.enhancedUserProfileStatusComplete
                    ]}>
                      <MaterialIcons 
                        name={selectedUser.profile_edit ? "hourglass-empty" : "check-circle"} 
                        size={28} 
                        color={selectedUser.profile_edit ? "#ea580c" : "#16a34a"} 
                      />
                      <View style={styles.enhancedUserProfileStatusContent}>
                        <Text style={[
                          styles.enhancedUserProfileStatusTitle,
                          { 
                            color: selectedUser.profile_edit 
                              ? "#ea580c" 
                              : "#16a34a" 
                          }
                        ]}>
                          {selectedUser.profile_edit ? 'Profile Edit Pending' : 'Profile Verified'}
                        </Text>
                        <Text style={styles.enhancedUserProfileStatusDescription}>
                          {selectedUser.profile_edit 
                            ? 'Student has requested profile changes that need approval' 
                            : 'Student profile is up-to-date and verified'
                          }
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
                
                {/* Action Buttons */}
                <View style={styles.enhancedUserProfileActions}>
                  <TouchableOpacity
                    style={styles.enhancedUserProfileActionButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <MaterialIcons name="close" size={20} color="#ffffff" />
                    <Text style={styles.enhancedUserProfileActionButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  const [filterStatus, setFilterStatus] = useState('all');

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      return () => {};
    }, [])
  );

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`http://${IP}:3000/api/admin/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
    } catch (error) {
      //console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to fetch tasks');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
  }, []);

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
          onPress={() => {
            setSelectedTask(item);
            setModalVisible(true);
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
            <View style={styles.taskCardInfo}>
              <MaterialIcons name="event" size={16} color="#64748b" />
              <Text style={styles.taskCardInfoText}>
                Due: {dueDate.toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.taskCardInfo}>
              <MaterialIcons name="person" size={16} color="#64748b" />
              <Text style={styles.taskCardInfoText}>
                {item.assigned_to}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Academic Assignments</Text>
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
      
      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTask}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.tasksList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <MaterialIcons name="assignment" size={60} color="#d1d5db" />
              <Text style={styles.emptyListText}>No tasks available</Text>
              <Text style={styles.emptyListSubText}>
                {filterStatus !== 'all' 
                  ? `No ${filterStatus} tasks found. Try changing the filter.` 
                  : 'Tasks will appear here once they are created'}
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
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            {selectedTask && (
              <ScrollView>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedTask.title}</Text>
                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <MaterialIcons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalContent}>
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name="event" size={20} color="#3b82f6" />
                    <Text style={styles.modalInfoText}>
                      Due Date: {new Date(selectedTask.due_date).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name="person" size={20} color="#3b82f6" />
                    <Text style={styles.modalInfoText}>
                      Assigned To: {selectedTask.assigned_to} ({selectedTask.role})
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name="person-add" size={20} color="#3b82f6" />
                    <Text style={styles.modalInfoText}>
                      Assigned By: {selectedTask.assigned_by}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    {(() => {
                      const statusStyle = getStatusStyle(selectedTask.status);
                      return (
                        <>
                          <MaterialIcons name={statusStyle.icon} size={20} color={statusStyle.text} />
                          <Text style={[styles.modalInfoText, { color: statusStyle.text }]}>
                            Status: {selectedTask.status}
                          </Text>
                        </>
                      );
                    })()}
                  </View>
                  
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Description:</Text>
                    <Text style={styles.descriptionText}>{selectedTask.description}</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
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
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
      return () => {};
    }, [])
  );

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`http://${IP}:3000/api/admin/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(response.data);
    } catch (error) {
      //console.error('Error fetching tickets:', error);
      Alert.alert('Error', 'Failed to fetch tickets');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTickets();
  }, []);

  const handleTicketAction = async (ticketId, action) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `http://${IP}:3000/api/admin/profile-update-tickets/${ticketId}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert(
        'Success', 
        `Ticket ${action}d successfully`,
        [{ text: 'OK', onPress: () => {
          setModalVisible(false);
          fetchTickets(); // Refresh tickets
        }}]
      );
    } catch (error) {
      //console.error(`Error ${action}ing ticket:`, error);
      Alert.alert('Error', `Failed to ${action} ticket`);
    }
  };

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'resolved':
      case 'completed':
      case 'closed':
        return { bg: '#dcfce7', text: '#16a34a', icon: 'check-circle' };
      case 'pending':
        return { bg: '#fef9c3', text: '#ca8a04', icon: 'hourglass-empty' };
      case 'approved':
        return { bg: '#dbeafe', text: '#3b82f6', icon: 'thumb-up' };
      case 'rejected':
        return { bg: '#fee2e2', text: '#ef4444', icon: 'thumb-down' };
      default:
        return { bg: '#f3f4f6', text: '#64748b', icon: 'help-outline' };
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'profile_update':
        return 'person';
      case 'technical':
        return 'computer';
      case 'academic':
        return 'school';
      case 'financial':
        return 'attach-money';
      default:
        return 'help-outline';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    let statusMatch = true;
    let typeMatch = true;
    
    if (filterStatus !== 'all') {
      statusMatch = ticket.status.toLowerCase() === filterStatus.toLowerCase();
    }
    
    if (filterType !== 'all') {
      typeMatch = (ticket.type || 'general').toLowerCase() === filterType.toLowerCase();
    }
    
    return statusMatch && typeMatch;
  });

  const renderTicket = ({ item, index }) => {
    const statusStyle = getStatusStyle(item.status);
    const typeIcon = getTypeIcon(item.type);
    const date = new Date(item.created_at);
    
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
            <Text style={styles.ticketDate}>{date.toLocaleDateString()}</Text>
          </View>
          
          <Text style={styles.ticketCardTitle}>{item.subject}</Text>
          
          <Text style={styles.ticketCardDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.ticketCardFooter}>
            <View style={styles.ticketCardInfo}>
              <MaterialIcons name="person" size={16} color="#64748b" />
              <Text style={styles.ticketCardInfoText}>
                {item.raised_by_name}
              </Text>
            </View>
            
            <View style={styles.ticketCardInfo}>
              <MaterialIcons name={typeIcon} size={16} color="#64748b" />
              <Text style={styles.ticketCardInfoText}>
                {item.type ? item.type.replace('_', ' ') : 'General'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Student Request Center</Text>
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
            ]}>All Status</Text>
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
              filterStatus === 'approved' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('approved')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'approved' && styles.filterButtonTextActive
            ]}>Approved</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterStatus === 'rejected' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('rejected')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'rejected' && styles.filterButtonTextActive
            ]}>Rejected</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterStatus === 'resolved' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('resolved')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'resolved' && styles.filterButtonTextActive
            ]}>Resolved</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterType === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === 'all' && styles.filterButtonTextActive
            ]}>All Types</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterType === 'profile_update' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('profile_update')}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === 'profile_update' && styles.filterButtonTextActive
            ]}>Profile Update</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterType === 'technical' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('technical')}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === 'technical' && styles.filterButtonTextActive
            ]}>Technical</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filterType === 'academic' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('academic')}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === 'academic' && styles.filterButtonTextActive
            ]}>Academic</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          renderItem={renderTicket}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.ticketsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <MaterialIcons name="confirmation-number" size={60} color="#d1d5db" />
              <Text style={styles.emptyListText}>No tickets available</Text>
              <Text style={styles.emptyListSubText}>
                {filterStatus !== 'all' || filterType !== 'all'
                  ? 'No tickets match your current filters. Try changing the filters.'
                  : 'Tickets will appear here once they are created'}
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
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            {selectedTicket && (
              <ScrollView>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedTicket.subject}</Text>
                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <MaterialIcons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalContent}>
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name="person" size={20} color="#3b82f6" />
                    <Text style={styles.modalInfoText}>
                      Raised By: {selectedTicket.raised_by_name} ({selectedTicket.role})
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name="event" size={20} color="#3b82f6" />
                    <Text style={styles.modalInfoText}>
                      Created: {new Date(selectedTicket.created_at).toLocaleString()}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    <MaterialIcons name={getTypeIcon(selectedTicket.type)} size={20} color="#3b82f6" />
                    <Text style={styles.modalInfoText}>
                      Type: {selectedTicket.type ? selectedTicket.type.replace('_', ' ') : 'General'}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoRow}>
                    {(() => {
                      const statusStyle = getStatusStyle(selectedTicket.status);
                      return (
                        <>
                          <MaterialIcons name={statusStyle.icon} size={20} color={statusStyle.text} />
                          <Text style={[styles.modalInfoText, { color: statusStyle.text }]}>
                            Status: {selectedTicket.status}
                          </Text>
                        </>
                      );
                    })()}
                  </View>
                  
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Description:</Text>
                    <Text style={styles.descriptionText}>{selectedTicket.description}</Text>
                  </View>
                  
                  {selectedTicket.type === 'profile_update' && selectedTicket.requested_updates && (
                    <View style={styles.updatesContainer}>
                      <Text style={styles.updatesLabel}>Requested Updates:</Text>
                      <View style={styles.updatesBox}>
                        {(() => {
                          try {
                            const updates = JSON.parse(selectedTicket.requested_updates);
                            return Object.entries(updates).map(([key, value]) => (
                              <View key={key} style={styles.updateRow}>
                                <Text style={styles.updateKey}>{key}:</Text>
                                <Text style={styles.updateValue}>{value}</Text>
                              </View>
                            ));
                          } catch (e) {
                            return <Text style={styles.updateError}>Invalid update data</Text>;
                          }
                        })()}
                      </View>
                    </View>
                  )}
                  
                  {selectedTicket.response && (
                    <View style={styles.responseContainer}>
                      <Text style={styles.responseLabel}>Response:</Text>
                      <View style={styles.responseBox}>
                        <Text style={styles.responseText}>{selectedTicket.response}</Text>
                      </View>
                    </View>
                  )}
                </View>
                
                {selectedTicket.type === 'profile_update' && selectedTicket.status === 'pending' && (
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleTicketAction(selectedTicket.id, 'approve')}
                    >
                      <MaterialIcons name="thumb-up" size={20} color="#ffffff" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleTicketAction(selectedTicket.id, 'reject')}
                    >
                      <MaterialIcons name="thumb-down" size={20} color="#ffffff" />
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
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
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      return () => {};
    }, [])
  );

  const fetchProfile = async () => {
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
      
      const response = await axios.get(`http://${IP}:3000/api/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
    } catch (error) {
      //console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
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
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatarContainer}>
            <MaterialIcons name="admin-panel-settings" size={80} color="#3b82f6" />
          </View>
          <Text style={styles.profileName}>{profile?.name || 'Admin'}</Text>
          <Text style={styles.profileEmail}>{profile?.email || 'No email available'}</Text>
        </View>
        
        <AnimatedCard delay={100} style={styles.profileInfoCard}>
          <Text style={styles.profileInfoTitle}>Admin Information</Text>
          
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
              <MaterialIcons name="security" size={20} color="#3b82f6" />
            </View>
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Role</Text>
              <Text style={styles.profileInfoValue}>Administrator</Text>
            </View>
          </View>
        </AnimatedCard>
        
        <AnimatedCard delay={200} style={styles.profileActionsCard}>
          <Text style={styles.profileActionsTitle}>Account Actions</Text>
          
          <TouchableOpacity 
            style={styles.profileActionButton}
            onPress={() => navigation.navigate('Users')}
          >
            <View style={styles.profileActionIconContainer}>
              <MaterialIcons name="people" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.profileActionText}>Manage Users</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.profileActionButton}
            onPress={() => navigation.navigate('Tasks')}
          >
            <View style={styles.profileActionIconContainer}>
              <MaterialIcons name="assignment" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.profileActionText}>View Tasks</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.profileActionButton}
            onPress={() => navigation.navigate('Tickets')}
          >
            <View style={styles.profileActionIconContainer}>
              <MaterialIcons name="confirmation-number" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.profileActionText}>Manage Tickets</Text>
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

// Main AdminDashboard Component
const AdminDashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Users') {
            iconName = focused ? 'people' : 'people-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Tasks') {
            iconName = 'assignment';
            return <MaterialIcons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Tickets') {
            iconName = 'confirmation-number';
            return <MaterialIcons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          height: Platform.OS === 'ios' ? 90 : 65,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Users" component={UsersScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Tickets" component={TicketsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  // Common Styles
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Constants.statusBarHeight,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  
  // Home Screen Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginRight: 10,
    marginBottom: 4,
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
  subGreeting: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
    fontWeight: '500',
  },
  currentDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  profileIcon: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 25,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 15,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 15,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#1e293b', // Darker color for better visibility
    marginTop: 4,
    fontWeight: '500', // Added font weight for better readability
  },
  quickActionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    margin: 20,
    marginTop: 5,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  
  // Users Screen Styles
  screenHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    marginLeft: 8,
    padding: 0,
  },
  sectionListContent: {
    padding: 15,
    paddingBottom: 30,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b82f6',
  },
  sectionHeaderCount: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sectionHeaderCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    marginBottom: 4,
    fontWeight: '500', // Added font weight for better readability
  },
  userBranch: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
  },
  userStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pendingBadge: {
    backgroundColor: '#fef9c3',
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
  },
  userStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  
  // Enhanced Users Screen Styles
  enhancedScreenHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  enhancedHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  enhancedScreenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  enhancedHeaderStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enhancedStatBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  enhancedStatBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  enhancedSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  enhancedSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    marginLeft: 8,
    paddingVertical: 0,
  },
  enhancedSearchClear: {
    padding: 4,
  },
  enhancedFilterTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  enhancedFilterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  enhancedFilterTabActive: {
    backgroundColor: '#eff6ff',
  },
  enhancedFilterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 4,
  },
  enhancedFilterTabTextActive: {
    color: '#3b82f6',
  },
  enhancedSortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  enhancedSortLabel: {
    fontSize: 13,
    color: '#64748b',
    marginRight: 4,
  },
  enhancedSortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enhancedSortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
    marginRight: 4,
  },
  enhancedResultsCount: {
    marginBottom: 8,
  },
  enhancedResultsCountText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
  enhancedLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  enhancedLoaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  enhancedSectionListContent: {
    padding: 16,
    paddingBottom: 30,
  },
  enhancedSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  enhancedSectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enhancedSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 6,
  },
  enhancedSectionCount: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  enhancedSectionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  enhancedUserCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  enhancedUserCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  enhancedUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  enhancedUserAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  enhancedUserInfo: {
    flex: 1,
  },
  enhancedUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  enhancedUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  enhancedUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  enhancedUserBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
  enhancedUserEmail: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 6,
  },
  enhancedUserMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enhancedUserMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  enhancedUserMetaText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  enhancedUserAction: {
    marginLeft: 8,
  },
  enhancedEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  enhancedEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  enhancedEmptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  enhancedEmptyButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  enhancedEmptyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  enhancedModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  enhancedModalView: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  enhancedModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  enhancedModalClose: {
    padding: 4,
  },
  enhancedModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  enhancedUserProfileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f8fafc',
  },
  enhancedUserProfileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  enhancedUserProfileAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  enhancedUserProfileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  enhancedUserProfileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enhancedUserProfileBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  enhancedUserProfileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  enhancedUserProfileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  enhancedUserProfileCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 8,
  },
  enhancedUserProfileCardContent: {
    padding: 16,
  },
  enhancedUserProfileItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  enhancedUserProfileItemIcon: {
    width: 36,
    alignItems: 'center',
    marginRight: 8,
  },
  enhancedUserProfileItemContent: {
    flex: 1,
  },
  enhancedUserProfileItemLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  enhancedUserProfileItemValue: {
    fontSize: 15,
    color: '#0f172a',
  },
  enhancedUserProfileDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
    marginLeft: 36,
  },
  enhancedUserProfileStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  enhancedUserProfileStatusPending: {
    backgroundColor: '#fff7ed',
  },
  enhancedUserProfileStatusComplete: {
    backgroundColor: '#f0fdf4',
  },
  enhancedUserProfileStatusContent: {
    flex: 1,
    marginLeft: 12,
  },
  enhancedUserProfileStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  enhancedUserProfileStatusDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  enhancedUserProfileActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 24,
  },
  enhancedUserProfileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  enhancedUserProfileActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  
  // Tasks Screen Styles
  filterContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f1f5f9',
  },
  filterButtonActive: {
    backgroundColor: '#dbeafe',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e293b', // Darker color for better visibility
  },
  filterButtonTextActive: {
    color: '#3b82f6',
  },
  tasksList: {
    padding: 15,
    paddingBottom: 30,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  overdueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 4,
  },
  taskCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  taskCardDescription: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    marginBottom: 12,
    fontWeight: '400', // Added font weight for better readability
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCardInfoText: {
    fontSize: 12,
    color: '#1e293b', // Darker color for better visibility
    marginLeft: 4,
    fontWeight: '500', // Added font weight for better readability
  },
  
  // Tickets Screen Styles
  ticketsList: {
    padding: 15,
    paddingBottom: 30,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
  ticketDate: {
    fontSize: 12,
    color: '#1e293b', // Darker color for better visibility
    fontWeight: '500', // Added font weight for better readability
  },
  ticketCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  ticketCardDescription: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    marginBottom: 12,
    fontWeight: '400', // Added font weight for better readability
  },
  ticketCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketCardInfoText: {
    fontSize: 12,
    color: '#1e293b', // Darker color for better visibility
    marginLeft: 4,
    fontWeight: '500', // Added font weight for better readability
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
    borderBottomColor: '#f1f5f9',
    padding: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
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
  updatesContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  updatesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  updatesBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  updateRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  updateKey: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
    marginRight: 8,
  },
  updateValue: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    flex: 1,
    fontWeight: '400', // Added font weight for better readability
  },
  updateError: {
    fontSize: 14,
    color: '#ef4444',
  },
  responseContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  responseBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  responseText: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    lineHeight: 20,
    fontWeight: '400', // Added font weight for better readability
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 0,
  },
  approveButton: {
    flexDirection: 'row',
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  rejectButton: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalButton: {
    backgroundColor: '#3b82f6',
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
  
  // User Detail Modal Styles
  userDetailHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  userDetailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userDetailAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  userDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 5,
  },
  userDetailRole: {
    fontSize: 14,
    color: '#1e293b', // Darker color for better visibility
    fontWeight: '500', // Added font weight for better readability
  },
  userDetailSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  userDetailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 15,
  },
  userDetailRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  userDetailInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userDetailLabel: {
    fontSize: 12,
    color: '#1e293b', // Darker color for better visibility
    marginBottom: 4,
    fontWeight: '500', // Added font weight for better readability
  },
  userDetailValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  userDetailStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  pendingStatusCard: {
    backgroundColor: '#fef9c3',
  },
  completedStatusCard: {
    backgroundColor: '#dcfce7',
  },
  userDetailStatusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
  },
  
  // Empty List Styles
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyListText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 15,
    textAlign: 'center',
  },
  emptyListSubText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Profile Screen Styles
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
});

export default AdminDashboard;