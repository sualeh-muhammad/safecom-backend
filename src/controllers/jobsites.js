const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllJobSites = async (req, res) => {
  try {
    const companyId = req.user.companyId; // Get from JWT token

    if (!companyId) {
      return res.status(400).json({
        error: "Company ID not found",
        message: "User must be associated with a company",
      });
    }

    const jobsites = await prisma.jobSite.findMany({
      where: {
        companyId: companyId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: { users: true }, // Count of users assigned to this jobsite
        },
      },
    });

    res.json(jobsites);
  } catch (error) {
    console.error("Error fetching jobsites:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch jobsites",
    });
  }
};



const getJobSiteById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const jobsite = await prisma.jobSite.findFirst({
      where: {
        id: id,
        companyId: companyId // Ensure user can only access their company's jobsites
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!jobsite) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Jobsite not found or you do not have access to it'
      });
    }

    res.json(jobsite);
  } catch (error) {
    console.error('Error fetching jobsite:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch jobsite'
    });
  }
}

const createNewJobSites = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { jobsiteName, streetAddress, city, state, zipCode, country, isActive } = req.body;

    // Validation
    if (!jobsiteName || !streetAddress || !city || !state || !zipCode || !country) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'All required fields must be provided'
      });
    }

    if (!companyId) {
      return res.status(400).json({
        error: 'Company ID not found',
        message: 'User must be associated with a company'
      });
    }

    // Check if jobsite name already exists for this company
    const existingJobsite = await prisma.jobSite.findFirst({
      where: {
        companyId: companyId,
        jobsiteName: jobsiteName
      }
    });

    if (existingJobsite) {
      return res.status(400).json({
        error: 'Duplicate jobsite name',
        message: 'A jobsite with this name already exists'
      });
    }

    // Create jobsite
    const jobsite = await prisma.jobSite.create({
      data: {
        companyId: companyId,
        jobsiteName,
        streetAddress,
        city,
        state,
        zipCode,
        country,
        isActive: isActive ?? true
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Jobsite created successfully',
      jobsite
    });
  } catch (error) {
    console.error('Error creating jobsite:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create jobsite'
    });
  }
}


const updateJobSite = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { jobsiteName, streetAddress, city, state, zipCode, country, isActive } = req.body;

    // Check if jobsite exists and belongs to company
    const existingJobsite = await prisma.jobSite.findFirst({
      where: {
        id: id,
        companyId: companyId
      }
    });

    if (!existingJobsite) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Jobsite not found or you do not have access to it'
      });
    }

    // Check for duplicate jobsite name (excluding current jobsite)
    if (jobsiteName && jobsiteName !== existingJobsite.jobsiteName) {
      const duplicateJobsite = await prisma.jobSite.findFirst({
        where: {
          companyId: companyId,
          jobsiteName: jobsiteName,
          id: { not: id }
        }
      });

      if (duplicateJobsite) {
        return res.status(400).json({
          error: 'Duplicate jobsite name',
          message: 'A jobsite with this name already exists'
        });
      }
    }

    // Update jobsite
    const updatedJobsite = await prisma.jobSite.update({
      where: { id: id },
      data: {
        ...(jobsiteName && { jobsiteName }),
        ...(streetAddress && { streetAddress }),
        ...(city && { city }),
        ...(state && { state }),
        ...(zipCode && { zipCode }),
        ...(country && { country }),
        ...(typeof isActive === 'boolean' && { isActive }),
        updatedAt: new Date()
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      message: 'Jobsite updated successfully',
      jobsite: updatedJobsite
    });
  } catch (error) {
    console.error('Error updating jobsite:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update jobsite'
    });
  }
}

const deleteJobSite = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // Check if jobsite exists and belongs to company
    const existingJobsite = await prisma.jobSite.findFirst({
      where: {
        id: id,
        companyId: companyId
      },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!existingJobsite) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Jobsite not found or you do not have access to it'
      });
    }

    // Check if jobsite has assigned users
    if (existingJobsite._count.users > 0) {
      return res.status(400).json({
        error: 'Cannot delete jobsite',
        message: 'This jobsite has users assigned to it. Please reassign users before deleting.'
      });
    }

    // Delete jobsite
    await prisma.jobSite.delete({
      where: { id: id }
    });

    res.json({
      message: 'Jobsite deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting jobsite:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete jobsite'
    });
  }
}



module.exports = {getAllJobSites , getJobSiteById , createNewJobSites , updateJobSite , deleteJobSite}