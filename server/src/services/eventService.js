const EVENTS = [
  {
    id: 'PIZZA_FESTIVAL',
    title: '🍕 Festival Gastronômico da Pizza',
    description: 'Alta demanda por tomates, queijo colonial e farinha de trigo em toda a região!',
    durationHours: 48,
    affectedItems: {
      tomato: 1.40,
      cheese: 1.45,
      flour: 1.35
    }
  },
  {
    id: 'AUTUMN_FAIR',
    title: '🎃 Feira das Abóboras & Grãos',
    description: 'Compradores estão pagando bônus por abóboras maduras e milho doce.',
    durationHours: 48,
    affectedItems: {
      pumpkin: 1.50,
      corn: 1.30,
      wheat: 1.25
    }
  },
  {
    id: 'DAIRY_EXPO',
    title: '🥛 Expo Láctea Regional',
    description: 'A indústria de laticínios busca leite cru fresco e queijos artesanais.',
    durationHours: 48,
    affectedItems: {
      milk: 1.40,
      cheese: 1.50
    }
  }
];

class EventService {
  constructor() {
    this.currentEventIndex = 0;
    this.eventStartedAt = Date.now();
  }

  getCurrentEvent() {
    const active = EVENTS[this.currentEventIndex];
    return {
      ...active,
      activeUntil: this.eventStartedAt + (active.durationHours * 3600 * 1000)
    };
  }

  getItemPriceMultiplier(itemId) {
    const event = this.getCurrentEvent();
    return event.affectedItems[itemId] || 1.0;
  }

  advanceEvent() {
    this.currentEventIndex = (this.currentEventIndex + 1) % EVENTS.length;
    this.eventStartedAt = Date.now();
    return this.getCurrentEvent();
  }
}

module.exports = new EventService();
