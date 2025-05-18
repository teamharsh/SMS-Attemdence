const Complain = require('../models/complainSchema.js');

const complainCreate = async (req, res) => {
  try {
    const complain = new Complain(req.body);
    const result = await complain.save();
    res.send(result);
  } catch (err) {
    res.status(500).json(err);
  }
};

const complainList = async (req, res) => {
  try {
    let complains = await Complain.find({ school: req.params.id }).populate(
      'user',
      'name'
    );
    if (complains.length > 0) {
      res.send(complains);
    } else {
      res.send({ message: 'No complains found' });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateComplaint = async (req, res) => {
  try {
    const { visibleToTeacher } = req.body;
    const updatedComplaint = await Complain.findByIdAndUpdate(
      req.params.id,
      { visibleToTeacher },
      { new: true }
    );
    if (!updatedComplaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.send(updatedComplaint);
  } catch (err) {
    res.status(500).json(err);
  }
};

const getTeacherVisibleComplaints = async (req, res) => {
  try {
    let complains = await Complain.find({
      school: req.params.id,
      visibleToTeacher: true,
    }).populate('user', 'name');

    if (complains.length > 0) {
      res.send(complains);
    } else {
      res.send({ message: 'No visible complains found' });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updatedComplaint = await Complain.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updatedComplaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.send(updatedComplaint);
  } catch (err) {
    res.status(500).json(err);
  }
};

const getStudentComplaints = async (req, res) => {
  try {
    const studentId = req.params.id;
    let complains = await Complain.find({ user: studentId })
      .populate('user', 'name')
      .sort({ date: -1 }); // Sort by date in descending order

    if (complains.length > 0) {
      // Format the data before sending
      const formattedComplaints = complains.map((complain) => ({
        _id: complain._id,
        complaint: complain.complaint,
        date: complain.date,
        status: complain.status,
        visibleToTeacher: complain.visibleToTeacher,
        user: {
          name: complain.user.name,
        },
      }));
      res.send(formattedComplaints);
    } else {
      res.send({ message: 'No complaints found' });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  complainCreate,
  complainList,
  updateComplaint,
  getTeacherVisibleComplaints,
  updateComplaintStatus,
  getStudentComplaints,
};
