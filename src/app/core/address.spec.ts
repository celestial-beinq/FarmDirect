import { NIGERIAN_STATES, formatAddress } from './accounts';
import { LGAS_BY_STATE } from './nigeria-lgas';

describe('formatAddress', () => {
  it('writes a full address on one line', () => {
    expect(
      formatAddress({
        street: '12 Admiralty Way',
        landmark: 'Mega Plaza',
        city: 'Lekki',
        lga: 'Eti Osa',
        state: 'Lagos',
      }),
    ).toBe('12 Admiralty Way, near Mega Plaza, Lekki, Eti Osa LGA, Lagos State');
  });

  it('skips the landmark when there is none, and names the FCT properly', () => {
    expect(
      formatAddress({ street: '5 Aminu Kano Crescent', landmark: '', city: 'Wuse 2', lga: 'Abuja Municipal Area Council', state: 'FCT - Abuja' }),
    ).toBe('5 Aminu Kano Crescent, Wuse 2, Abuja Municipal Area Council LGA, FCT, Abuja');
  });

  it('stays within the 300 characters the database allows', () => {
    const longest = formatAddress({
      street: 'x'.repeat(115),
      landmark: 'x'.repeat(60),
      city: 'x'.repeat(50),
      lga: 'x'.repeat(40),
      state: 'Akwa Ibom',
    });
    expect(longest.length).toBeLessThanOrEqual(300);
  });
});

describe('LGAS_BY_STATE', () => {
  it('covers every state and the FCT, 774 LGAs in all', () => {
    for (const state of NIGERIAN_STATES) expect(LGAS_BY_STATE[state]?.length).toBeGreaterThan(0);
    const total = Object.values(LGAS_BY_STATE).reduce((sum, list) => sum + list.length, 0);
    expect(total).toBe(774);
  });

  it('has the official number of LGAs for a few states', () => {
    expect(LGAS_BY_STATE['Lagos'].length).toBe(20);
    expect(LGAS_BY_STATE['Kano'].length).toBe(44);
    expect(LGAS_BY_STATE['FCT - Abuja'].length).toBe(6);
    expect(LGAS_BY_STATE['Bayelsa'].length).toBe(8);
  });
});
