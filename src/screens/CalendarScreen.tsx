import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ootdStorage } from '../services/storage';
import { OOTD } from '../types';
import { Ionicons } from '@expo/vector-icons';
import AdBanner from '../components/AdBanner';

const { width } = Dimensions.get('window');
const screenPadding = 32; // 16 * 2 (左右padding)
const calendarPadding = 32; // 日历内部padding
const totalWidth = width - screenPadding - calendarPadding;
const dayWidth = Math.floor(totalWidth / 7);

export default function CalendarScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [ootds, setOotds] = useState<OOTD[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const loadOOTDs = async () => {
    try {
      const data = await ootdStorage.getAll();
      setOotds(data);
    } catch (error) {
      console.error('Error loading OOTDs:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOOTDs();
    }, [])
  );

  const handleDeleteOOTD = async (id: string) => {
    Alert.alert(
      t.calendar.deleteConfirm,
      t.calendar.deleteMessage,
      [
        {
          text: t.common.cancel,
          style: 'cancel',
        },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await ootdStorage.delete(id);
              await loadOOTDs();
              Alert.alert(t.common.success, t.calendar.deleteSuccess);
            } catch (error) {
              Alert.alert(t.common.error, t.calendar.deleteFailed);
            }
          },
        },
      ]
    );
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    // 添加空白日期
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // 添加实际日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const hasOOTDOnDate = (date: Date) => {
    return ootds.some((ootd) => {
      const ootdDate = typeof ootd.date === 'string' ? new Date(ootd.date) : ootd.date;
      return (
        ootdDate.getFullYear() === date.getFullYear() &&
        ootdDate.getMonth() === date.getMonth() &&
        ootdDate.getDate() === date.getDate()
      );
    });
  };

  const getSelectedDateOOTDs = () => {
    return ootds.filter((ootd) => {
      const ootdDate = typeof ootd.date === 'string' ? new Date(ootd.date) : ootd.date;
      return (
        ootdDate.getFullYear() === selectedDate.getFullYear() &&
        ootdDate.getMonth() === selectedDate.getMonth() &&
        ootdDate.getDate() === selectedDate.getDate()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isSelectedDate = (day: number) => {
    return (
      currentDate.getFullYear() === selectedDate.getFullYear() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      day === selectedDate.getDate()
    );
  };

  const days = getDaysInMonth(currentDate);
  const selectedOOTDs = getSelectedDateOOTDs();
  const monthYearText = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 大标题 */}
      <Text style={styles.pageTitle}>{t.calendar.title}</Text>
      
      {/* 月份选择器 */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
          <Ionicons name="chevron-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Text style={[styles.monthText, { color: theme.text }]}>{monthYearText}</Text>
          <TouchableOpacity 
            onPress={() => {
              const today = new Date();
              setCurrentDate(today);
              setSelectedDate(today);
            }}
            style={styles.todayButton}
          >
            <Text style={[styles.todayButtonText, { color: theme.primary }]}>
              {t.calendar.today}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 日历网格 */}
        <View style={[styles.calendarContainer, { backgroundColor: theme.card }]}>
          {/* 星期标题 */}
          <View style={styles.weekDaysRow}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.weekDayCell}>
                <Text style={[styles.weekDayText, { color: theme.textSecondary }]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* 日期网格 */}
          <View style={styles.daysGrid}>
            {days.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const hasOOTD = hasOOTDOnDate(date);
              const isTodayDate = isToday(date);
              const isSelected = isSelectedDate(day);

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: theme.primary },
                    isTodayDate && !isSelected && { borderWidth: 2, borderColor: theme.primary },
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: isSelected ? '#fff' : theme.text },
                    ]}
                  >
                    {day}
                  </Text>
                  {hasOOTD && (
                    <View
                      style={[
                        styles.dotIndicator,
                        { backgroundColor: isSelected ? '#fff' : theme.primary },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 选中日期穿搭 */}
        <View style={styles.todaySection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
          </Text>

          {selectedOOTDs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {t.calendar.empty}
              </Text>
            </View>
          ) : (
            <View style={styles.ootdGrid}>
              {selectedOOTDs.map((ootd) => (
                <View key={ootd.id} style={styles.ootdItem}>
                  <Image source={{ uri: ootd.imageUri }} style={styles.ootdImage} />
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: theme.error }]}
                    onPress={() => handleDeleteOOTD(ootd.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      
      <AdBanner placement="bottom" onUpgrade={() => navigation.navigate('Subscription')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1C1B1F',
    textAlign: 'center',
    paddingTop: 32,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthButton: {
    padding: 8,
  },
  monthCenter: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  todayButton: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    width: dayWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: dayWidth,
    height: dayWidth,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  dotIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  todaySection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  ootdGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ootdItem: {
    position: 'relative',
    width: (width - 56) / 3,
    height: (width - 56) / 3,
  },
  ootdImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
