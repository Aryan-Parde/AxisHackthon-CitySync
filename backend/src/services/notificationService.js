class NotificationService {
  // Mock SMS notification
  static async sendSMS(mobile, message) {
    console.log(`📱 SMS to ${mobile}: ${message}`);
    return { success: true, channel: 'sms' };
  }

  // Mock WhatsApp notification
  static async sendWhatsApp(mobile, message) {
    console.log(`💬 WhatsApp to ${mobile}: ${message}`);
    return { success: true, channel: 'whatsapp' };
  }

  // Send complaint status update
  static async notifyStatusUpdate(complaint, user) {
    const statusMessages = {
      submitted: `Your complaint ${complaint.ticketId} has been submitted successfully.`,
      under_review: `Your complaint ${complaint.ticketId} is now under review.`,
      in_progress: `Work has started on your complaint ${complaint.ticketId}.`,
      resolved: `Your complaint ${complaint.ticketId} has been resolved! ✅`,
      escalated: `Your complaint ${complaint.ticketId} has been escalated to higher authority. 🔺`,
      closed: `Your complaint ${complaint.ticketId} has been closed.`
    };

    const message = statusMessages[complaint.status] || `Update on complaint ${complaint.ticketId}`;

    await this.sendSMS(user.mobile, message);
    await this.sendWhatsApp(user.mobile, message);
  }

  // Send escalation notification
  static async notifyEscalation(complaint, escalation) {
    const message = `⚠️ Complaint ${complaint.ticketId} escalated to Level ${escalation.toLevel}. Immediate action required.`;
    console.log(`🔔 ESCALATION ALERT: ${message}`);
  }

  // Send duplicate merge notification
  static async notifyDuplicate(complaint, originalTicketId) {
    const message = `Your complaint has been merged with ${originalTicketId}. It has been reported by ${complaint.duplicateCount} users.`;
    console.log(`🔗 DUPLICATE MERGE: ${message}`);
  }
}

module.exports = NotificationService;
