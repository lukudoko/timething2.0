// utils/scheduler.js
export class WidgetScheduler {
  constructor(config) {
    this.config = config;
    this.timeSlots = {
      'morning': { start: 6, end: 12 },
      'noon': { start: 12, end: 18 },
      'evening': { start: 18, end: 24 },
      'night': { start: 0, end: 6 }
    };
  }

  getCurrentTimeSlot() {
    const hour = new Date().getHours();
    for (const [slot, { start, end }] of Object.entries(this.timeSlots)) {
      if (start <= end) {
        // Same-day range (morning, noon, afternoon, evening)
        if (hour >= start && hour < end) return slot;
      } else {
        // Overnight range (night)
        if (hour >= start || hour < end) return slot;
      }
    }
    return 'night'; // fallback
  }

  shouldShowWidget(widgetKey) {
    const widgetConfig = this.config.widgets[widgetKey];
    if (!widgetConfig?.enabled) return false;

    if (widgetConfig.timeSlots && widgetConfig.timeSlots.length > 0) {
      return widgetConfig.timeSlots.includes(this.getCurrentTimeSlot());
    }
    return true; // show always if no time slots specified
  }

  getActiveWidgets() {
    return Object.keys(this.config.widgets).filter(key => 
      this.shouldShowWidget(key)
    );
  }
}