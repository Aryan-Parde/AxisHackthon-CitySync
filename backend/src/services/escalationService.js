const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const Escalation = require('../models/Escalation');
const AIService = require('./aiService');

class EscalationService {
  /**
   * Auto-escalation check - run periodically
   * Checks for complaints that have exceeded their SLA
   */
  static async checkAndEscalate() {
    try {
      const complaints = await Complaint.find({
        status: { $in: ['submitted', 'under_review', 'in_progress', 'escalated'] },
        escalationLevel: { $lt: 3 }
      }).populate('department');

      let escalatedCount = 0;

      for (const complaint of complaints) {
        const department = complaint.department;
        if (!department || !department.escalationChain) continue;

        const currentLevel = department.escalationChain[complaint.escalationLevel];
        if (!currentLevel) continue;

        const hoursElapsed = (Date.now() - new Date(complaint.updatedAt).getTime()) / (1000 * 60 * 60);

        if (hoursElapsed > currentLevel.autoEscalateAfterHours) {
          await this.escalateComplaint(complaint, department);
          escalatedCount++;
        }
      }

      if (escalatedCount > 0) {
        console.log(`🔺 Auto-escalated ${escalatedCount} complaint(s)`);
      }

      return escalatedCount;
    } catch (error) {
      console.error('Auto-escalation error:', error.message);
      return 0;
    }
  }

  // Escalate a specific complaint
  static async escalateComplaint(complaint, department) {
    const newLevel = complaint.escalationLevel + 1;
    const nextInChain = department.escalationChain[newLevel];

    // Create escalation record
    const escalation = await Escalation.create({
      complaint: complaint._id,
      fromLevel: complaint.escalationLevel,
      toLevel: newLevel,
      reason: `Auto-escalated: SLA breach at level ${complaint.escalationLevel}`,
      escalatedTo: {
        designation: nextInChain?.designation || 'Senior Officer',
        department: department._id
      }
    });

    // Update complaint
    complaint.escalationLevel = newLevel;
    complaint.status = 'escalated';
    complaint.timeline.push({
      status: 'escalated',
      timestamp: new Date(),
      note: `Escalated to Level ${newLevel}: ${nextInChain?.designation || 'Higher Authority'}`
    });

    // If final escalation level, generate PIL draft
    if (newLevel >= 3) {
      const previousEscalations = await Escalation.find({
        complaint: complaint._id
      }).sort({ createdAt: 1 });

      const pilDraft = await AIService.generatePILDraft(complaint, previousEscalations);

      escalation.pilDraft = pilDraft;
      await escalation.save();

      complaint.timeline.push({
        status: 'escalated',
        timestamp: new Date(),
        note: 'PIL draft auto-generated due to prolonged non-resolution'
      });
    }

    await complaint.save();

    console.log(`🔺 Complaint ${complaint.ticketId} escalated to Level ${newLevel}`);
    return escalation;
  }

  // Get escalation history for a complaint
  static async getEscalationHistory(complaintId) {
    return Escalation.find({ complaint: complaintId })
      .populate('escalatedTo.department', 'name code')
      .sort({ createdAt: 1 });
  }

  // Manual escalation
  static async manualEscalate(complaintId, reason) {
    const complaint = await Complaint.findById(complaintId).populate('department');
    if (!complaint) throw new Error('Complaint not found');

    const department = complaint.department;
    if (!department) throw new Error('Department not assigned');

    return this.escalateComplaint(complaint, department);
  }
}

module.exports = EscalationService;
