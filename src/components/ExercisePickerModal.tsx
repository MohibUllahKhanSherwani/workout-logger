import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseDefinition, ExerciseType, MuscleCategory } from '@/types/workout';
import { CATEGORIES } from '@/constants/default-exercises';
import { useWorkout } from '@/context/WorkoutContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseDefinition) => void;
}

export const ExercisePickerModal: React.FC<Props> = ({
  visible,
  onClose,
  onSelectExercise,
}) => {
  const { exercises, addNewCustomExercise } = useWorkout();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Custom exercise creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseCategory, setNewExerciseCategory] = useState<MuscleCategory>('Chest');
  const [newExerciseType, setNewExerciseType] = useState<ExerciseType>('strength');

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch =
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || ex.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exercises, search, selectedCategory]);

  const handleCreateNew = async () => {
    if (!newExerciseName.trim()) return;
    const created = await addNewCustomExercise(
      newExerciseName.trim(),
      newExerciseCategory,
      newExerciseType
    );
    setNewExerciseName('');
    setShowCreateModal(false);
    onSelectExercise(created);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Exercise / Category</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search e.g. Bench Press, Squat, Run..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="words"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter Chips */}
          <View style={styles.categoriesContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={['All', ...CATEGORIES]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = selectedCategory === item;
                return (
                  <TouchableOpacity
                    style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                    onPress={() => setSelectedCategory(item)}
                  >
                    <Text
                      style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Exercise List */}
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exerciseItem}
                onPress={() => {
                  onSelectExercise(item);
                  onClose();
                }}
              >
                <View style={styles.itemIconContainer}>
                  <Ionicons
                    name={item.type === 'cardio' ? 'walk' : 'barbell'}
                    size={20}
                    color="#0284c7"
                  />
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.badgeRow}>
                    <Text style={styles.categoryBadge}>{item.category}</Text>
                    {item.isCustom && <Text style={styles.customBadge}>Custom</Text>}
                  </View>
                </View>
                <Ionicons name="add-circle" size={24} color="#0284c7" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No exercise found for &quot;{search}&quot;</Text>
                <TouchableOpacity
                  style={styles.quickCreateBtn}
                  onPress={() => {
                    setNewExerciseName(search);
                    setShowCreateModal(true);
                  }}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.quickCreateBtnText}>Create &quot;{search}&quot;</Text>
                </TouchableOpacity>
              </View>
            }
          />

          {/* Bottom Action: Create New Category / Exercise */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.newCategoryBtn}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#0284c7" />
              <Text style={styles.newCategoryBtnText}>+ Create New Category / Exercise</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal for Creating New Exercise / Category */}
        <Modal visible={showCreateModal} animationType="fade" transparent>
          <View style={styles.subOverlay}>
            <View style={styles.subModalContainer}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Create New Exercise</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Exercise Name</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. Incline Bench Press, 5K Run..."
                placeholderTextColor="#94a3b8"
                value={newExerciseName}
                onChangeText={setNewExerciseName}
                autoFocus
              />

              <Text style={styles.inputLabel}>Category / Muscle Group</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      newExerciseCategory === cat && styles.categoryOptionSelected,
                    ]}
                    onPress={() => setNewExerciseCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        newExerciseCategory === cat && styles.categoryOptionTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    newExerciseType === 'strength' && styles.typeBtnSelected,
                  ]}
                  onPress={() => setNewExerciseType('strength')}
                >
                  <Ionicons
                    name="barbell"
                    size={16}
                    color={newExerciseType === 'strength' ? '#fff' : '#475569'}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      newExerciseType === 'strength' && styles.typeBtnTextSelected,
                    ]}
                  >
                    Strength (Sets/Reps)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    newExerciseType === 'cardio' && styles.typeBtnSelected,
                  ]}
                  onPress={() => setNewExerciseType('cardio')}
                >
                  <Ionicons
                    name="walk"
                    size={16}
                    color={newExerciseType === 'cardio' ? '#fff' : '#475569'}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      newExerciseType === 'cardio' && styles.typeBtnTextSelected,
                    ]}
                  >
                    Cardio / Running
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveCreateBtn,
                    !newExerciseName.trim() && styles.saveCreateBtnDisabled,
                  ]}
                  disabled={!newExerciseName.trim()}
                  onPress={handleCreateNew}
                >
                  <Text style={styles.saveCreateBtnText}>Save & Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    paddingTop: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5 },
      android: { elevation: 8 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#0284c7',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  itemIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    fontSize: 11,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '500',
  },
  customBadge: {
    fontSize: 11,
    color: '#0284c7',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  quickCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  quickCreateBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  newCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0284c7',
    borderStyle: 'dashed',
    backgroundColor: '#f0f9ff',
  },
  newCategoryBtnText: {
    color: '#0284c7',
    fontSize: 15,
    fontWeight: '700',
  },

  // Submodal styles
  subOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 14,
    marginBottom: 6,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryOptionSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  categoryOptionTextSelected: {
    color: '#ffffff',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  typeBtnSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  typeBtnTextSelected: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '600',
  },
  saveCreateBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveCreateBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveCreateBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
