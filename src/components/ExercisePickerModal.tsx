import React, { useState } from 'react';
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
import { CategoryItem, ExerciseType } from '@/types/workout';
import { useWorkout } from '@/context/WorkoutContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectCategory: (cat: CategoryItem) => void;
}

export const ExercisePickerModal: React.FC<Props> = ({
  visible,
  onClose,
  onSelectCategory,
}) => {
  const { categories, createCategory } = useWorkout();
  const [search, setSearch] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<ExerciseType>('strength');
  const [isAddingInline, setIsAddingInline] = useState(false);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateNew = async () => {
    if (!newCatName.trim()) return;
    const created = await createCategory(newCatName.trim(), newCatType);
    setNewCatName('');
    setIsAddingInline(false);
    onSelectCategory(created);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Category</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search category (e.g. Bench Press, Run)..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Inline Create Category Form */}
          {isAddingInline ? (
            <View style={styles.createBox}>
              <Text style={styles.createBoxTitle}>Create New Category</Text>
              <TextInput
                style={styles.createInput}
                placeholder="Category name (e.g. Incline Press, Squat, Run)..."
                placeholderTextColor="#94a3b8"
                value={newCatName}
                onChangeText={setNewCatName}
                autoFocus
              />

              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    newCatType === 'strength' && styles.typeBtnActive,
                  ]}
                  onPress={() => setNewCatType('strength')}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      newCatType === 'strength' && styles.typeBtnTextActive,
                    ]}
                  >
                    Strength (Sets/Reps)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    newCatType === 'run' && styles.typeBtnActive,
                  ]}
                  onPress={() => setNewCatType('run')}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      newCatType === 'run' && styles.typeBtnTextActive,
                    ]}
                  >
                    Run (Distance/Time)
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.createBtnsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsAddingInline(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    !newCatName.trim() && styles.saveBtnDisabled,
                  ]}
                  disabled={!newCatName.trim()}
                  onPress={handleCreateNew}
                >
                  <Text style={styles.saveBtnText}>Save & Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addCategoryBtn}
              onPress={() => setIsAddingInline(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#0284c7" />
              <Text style={styles.addCategoryBtnText}>+ Create New Category</Text>
            </TouchableOpacity>
          )}

          {/* Category List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.catItem}
                onPress={() => {
                  onSelectCategory(item);
                  onClose();
                }}
              >
                <View style={styles.catItemLeft}>
                  <Ionicons
                    name={item.type === 'run' ? 'walk' : 'barbell'}
                    size={20}
                    color="#0284c7"
                  />
                  <Text style={styles.catItemName}>{item.name}</Text>
                </View>
                <View style={styles.catBadge}>
                  <Text style={styles.catBadgeText}>
                    {item.type === 'run' ? 'Run' : 'Strength'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !isAddingInline ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {categories.length === 0
                      ? 'No categories yet. Click "+ Create New Category" above to add your first one (e.g. Bench Press, Incline Press, Run).'
                      : `No category found matching "${search}"`}
                  </Text>
                </View>
              ) : undefined
            }
          />
        </View>
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
    height: '80%',
    paddingTop: 16,
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
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 6,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f0f9ff',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  addCategoryBtnText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '700',
  },
  createBox: {
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  createBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  createInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    minHeight: 44,
    marginBottom: 10,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  typeBtnTextActive: {
    color: '#ffffff',
  },
  createBtnsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  catItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  catItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  catBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  catBadgeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 30,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
