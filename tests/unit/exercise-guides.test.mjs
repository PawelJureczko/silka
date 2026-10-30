import { test } from 'node:test'
import assert from 'node:assert/strict'
import { exerciseGuide } from '../../app/domain/exercise-guides.ts'

test('instrukcje: dopasowanie zachowuje wariant i sprzęt mimo różnic zapisu', () => {
  const cable = exerciseGuide('  WIOSLOWANIE   SIEDZAC NA WYCIAGU ')
  const machine = exerciseGuide('Wiosłowanie na maszynie')
  assert.equal(cable.direct, true)
  assert.match(cable.url, /\/48\/seated-row\/$/)
  assert.notEqual(cable.url, machine.url)
  assert.notEqual(exerciseGuide('Ściąganie drążka górnego wyciągu za głowę').url, exerciseGuide('Ściąganie drążka wyciągu').url)
  assert.notEqual(exerciseGuide('Wyciskanie hantli nad głowę stojąc').url, exerciseGuide('Wyciskanie hantli nad głowę siedząc').url)
})

test('instrukcje: brak dokładnego ACE ma bezpośredni materiał innego wydawcy', () => {
  const guide = exerciseGuide('Prostowanie nogi w tył na wyciągu')
  assert.equal(guide.source, 'StrengthLog')
  assert.equal(guide.direct, true)
  assert.equal(guide.url, 'https://www.strengthlog.com/cable-glute-kickback/')
  assert.match(exerciseGuide('Odwrotne rozpiętki z hantlami').note, /podparciem klatki/)
})

test('instrukcje: nieznana nazwa nie zgaduje wariantu ani nie staje się adresem', () => {
  for (const name of ['Wiosłowanie na maszynie nowy wariant', 'javascript:alert(1)', 'https://example.com', '']) {
    const guide = exerciseGuide(name)
    assert.equal(guide.direct, false)
    assert.equal(guide.url, 'https://www.acefitness.org/resources/everyone/exercise-library/')
    assert.match(guide.note, /Nie przypisano jeszcze/)
  }
})
