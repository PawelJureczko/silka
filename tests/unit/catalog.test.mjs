import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterCatalog, groupCatalog } from '../../app/domain/catalog.ts'

const exercises = [
  { id: 'w', name: 'Wyciskanie hantli nad głowę', equipment: 'Hantle', muscle_group: 'Barki' },
  { id: 's', name: 'Ściąganie drążka', equipment: 'Wyciąg', muscle_group: 'Plecy' },
  { id: 'u', name: 'Unoszenie hantli przed siebie', equipment: 'Hantle', muscle_group: 'Barki' },
  { id: 'r', name: 'Rozpiętki', equipment: 'Hantle', muscle_group: 'Klatka piersiowa' },
]

test('pełna lista zachowuje polską kolejność i nie modyfikuje katalogu', () => {
  const original = structuredClone(exercises)
  assert.deepEqual(filterCatalog(exercises, '').map(item => item.id), ['r', 's', 'u', 'w'])
  assert.deepEqual(exercises, original)
})

test('wyszukiwanie obejmuje nazwę, sprzęt i partię, również bez polskich znaków', () => {
  assert.deepEqual(filterCatalog(exercises, 'sciaganie wyciag').map(item => item.id), ['s'])
  assert.deepEqual(filterCatalog(exercises, 'BARKI hantle').map(item => item.id), ['u', 'w'])
  assert.deepEqual(filterCatalog(exercises, 'nieistniejące'), [])
})

test('grupy mają pełne, uporządkowane listy i nie gubią ostatnich pozycji', () => {
  const groups = groupCatalog(exercises)
  assert.deepEqual(groups.map(group => group.name), ['Barki', 'Klatka piersiowa', 'Plecy'])
  assert.deepEqual(groups[0].exercises.map(item => item.id), ['u', 'w'])
  assert.equal(groups.flatMap(group => group.exercises).length, exercises.length)
  assert.deepEqual(groupCatalog([]), [])
})
