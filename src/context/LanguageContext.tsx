
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'km';

type Translations = {
  [key: string]: string | Translations;
};

const translations = {
  en: {
    nav: {
      dashboard: "Dashboard",
      attendance: "Attendance",
      leaves: "Leaves",
      projects: "Projects",
      tasks: "Tasks",
      employees: "Employees",
      payroll: "Payroll",
      departments: "Departments",
      reports: "Reports",
      main: "Main",
      management: "Management",
      profile: "Profile",
      logout: "Logout",
      chat: "Chat",
      recruitment: "Recruitment",
      settings: "Settings"
    },
    header: {
        notifications: "Notifications",
        markAllRead: "Mark all as read",
        noNotifications: "No new notifications",
        viewAll: "View All"
    },
    time: {
        justNow: "Just now",
        ago: "ago",
        years: "years",
        months: "months",
        days: "days",
        hours: "hours",
        minutes: "minutes"
    },
    common: {
      welcome: "Welcome",
      search: "Search...",
      loading: "Loading...",
      status: "Status",
      active: "Active",
      actions: "Actions",
      save: "Save",
      add: "Add",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      close: "Close",
      unknown: "Unknown",
      noPhone: "No phone"
    },
    logo: {
      subtitle: "Labour & Human Resource Consulting"
    },
    login: {
      welcomeBack: "Welcome Back",
      resetPassword: "Reset Password",
      enterOtp: "Enter OTP",
      signInToAccess: "Sign in to access your workspace",
      enterPhoneForOtp: "Enter your phone number to receive an OTP",
      weSentCode: "We sent a code to",
      phoneNumber: "Phone Number"
    },
    messages: {
        imageSize: "Image must be smaller than 2MB",
        loadError: "Failed to load system data",
        opFailed: "Operation failed",
        enterNew: "Enter new",
        added: "added"
    },
    dashboard: {
      hrOverview: "HR Overview",
      teamOverview: "Team Overview",
      totalEmployees: "Total Employees",
      presentToday: "Present Today",
      pendingRequests: "Pending Requests",
      openPositions: "Open Positions",
      attendanceTrend: "Attendance Trend",
      deptDist: "Department Distribution",
      welcomeBack: "Welcome back",
      todaysStatus: "Today's Status",
      checkedIn: "Checked In",
      notCheckedIn: "Not Checked In",
      shiftEnded: "Shift Ended",
      remainingLeave: "Remaining Leave Days",
      onTimeArrival: "On-Time Arrival"
    },
    attendance: {
      title: "Attendance & Clock In",
      currentStatus: "Current Status",
      clockIn: "Clock In",
      clockOut: "Clock Out",
      locationCheck: "Location Check",
      officeLocation: "Office Location",
      yourLocation: "Your Location",
      distance: "Distance from Office",
      inZone: "IN ZONE",
      outOfZone: "OUT OF ZONE",
      history: "Attendance History",
      date: "Date",
      checkIn: "Check In",
      checkOut: "Check Out"
    },
    chat: {
        selectUser: "Select a colleague to start chatting",
        typeMessage: "Type a message...",
        search: "Search colleagues...",
        online: "Online",
        offline: "Offline"
    },
    tasks: {
        title: "Team Tasks",
        create: "New Task",
        todo: "To Do",
        inProgress: "In Progress",
        done: "Done"
    },
    employees: {
        title: "Employees",
        subtitle: "Manage your team members and their roles",
        searchPlaceholder: "Search by name, email or ID...",
        newEmployee: "New Employee",
        table: {
            id: "ID",
            employee: "Employee",
            role: "Role",
            department: "Department",
            status: "Status",
            joined: "Joined",
            actions: "Actions"
        },
        details: {
            jobInfo: "Job Information",
            compensation: "Compensation",
            contact: "Contact Information",
            basicSalary: "Basic Salary",
            copyId: "ID copied to clipboard"
        },
        confirmDelete: "Are you sure you want to delete this employee?"
    },
    onboarding: {
        title: "Onboard Talent",
        subtitle: "New Employee Registration",
        editTitle: "Edit Profile",
        editSubtitle: "Editing records for",
        steps: {
            identity: "Identity",
            personal: "Personal",
            placement: "Placement",
            contact: "Contact",
            pay: "Pay",
            family: "Family",
            review: "Review"
        },
        basics: {
            title: "Core Identification",
            desc: "These details establish the employee's unique identity in the system. The Employee ID is used for login and cannot be easily changed later.",
            employeeId: "Employee ID",
            autoGenerate: "Auto-Generate ID",
            email: "Email Address",
            firstName: "First Name",
            lastName: "Last Name",
            accessLevel: "System Access Level",
            managerRestricted: "Manager Restricted",
            standardEmployee: "Standard Employee",
            managerRestrictionMsg: "As a Manager, you can only onboard standard employees. Contact Admin for other roles.",
            enablePortal: "Enable Self-Service Portal",
            portalDesc: "Allow this user to log in to view payslips, request leaves, and check attendance."
        },
        roles: {
            admin: { label: "Administrator", desc: "Full system control. Can manage all users, settings, and sensitive data." },
            hr: { label: "HR Manager", desc: "Manage recruitment, payroll, attendance, and employee records." },
            manager: { label: "Team Manager", desc: "View direct reports, approve leaves, and manage team projects." },
            employee: { label: "Employee", desc: "Basic access. Can view own profile, payslips, and request leaves." }
        },
        personal: {
            title: "Personal Information",
            desc: "Official identification data required for employment contracts.",
            profilePhoto: "Profile Photo",
            change: "Change",
            upload: "Upload",
            photoRequirements: "Allowed *.jpeg, *.jpg, *.png\nMax size of 5 MB",
            gender: "Gender",
            dob: "Date of Birth",
            nationality: "Nationality",
            nationalId: "National ID Card",
            passport: "Passport Number",
            ethnicity: "Ethnicity",
            religion: "Religion",
            optional: "Optional"
        },
        job: {
            title: "Employment Details",
            department: "Department",
            position: "Position",
            reportsTo: "Reports To",
            managerHelper: "Managers from the selected department appear first.",
            employmentType: "Employment Type",
            joinDate: "Join Date",
            probationEnd: "Probation End Date",
            lockedDept: "Locked to your department"
        },
        contact: {
            title: "Contact Information",
            phone: "Phone Number",
            email: "Personal Email",
            emailHelper: "Secondary email if different from work",
            address: "Address",
            city: "City / Province",
            website: "Website / Portfolio"
        },
        salary: {
            baseComp: "Base Compensation",
            basicSalary: "Basic Salary",
            currency: "Currency",
            banking: "Banking Details",
            bankName: "Bank Name",
            accountNumber: "Account Number",
            payrollPreview: "Payroll Preview",
            monthlyBreakdown: "Monthly Breakdown",
            baseSalary: "Base Salary",
            allowances: "Allowances",
            deductions: "Deductions",
            estimatedNet: "Estimated Net Pay",
            equivalent: "Equivalent (Approx)",
            disclaimer: "Calculations based on 2024 Cambodian Labor Law guidelines. Actual amounts may vary based on dependents and attendance."
        },
        family: {
            emergencyContact: "Emergency Contact",
            desc: "This information is critical for employee safety and will only be accessed in case of workplace emergencies.",
            contactName: "Contact Name",
            relationship: "Relationship",
            phone: "Phone Number"
        },
        review: {
            officialId: "Official ID",
            joined: "Joined",
            type: "Type",
            pendingDocs: "Pending Documentation",
            pendingDocsMsg: "System will generate a provisional contract. Employee must submit physical copies of ID and Vaccination Card within 7 days.",
            identityAccess: "Identity & Access",
            personalDetails: "Personal Details",
            placement: "Placement",
            compensation: "Compensation",
            contactEmergency: "Contact & Emergency",
            portalAccess: "Portal Access",
            enabled: "Enabled",
            disabled: "Disabled"
        },
        buttons: {
            next: "Next Step",
            back: "Back",
            finish: "Finish Onboarding",
            saveProfile: "Save Profile",
            saveDraft: "Draft",
            importCsv: "Import CSV"
        },
        messages: {
            saved: "Saved",
            attention: "Attention Needed",
            fixErrors: "Please correct the highlighted fields below to continue.",
            success: "Operation successful",
            draftSaved: "Draft saved successfully"
        }
    },
    form: {
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email",
        phone: "Phone",
        dob: "Date of Birth",
        gender: "Gender",
        nationality: "Nationality",
        address: "Address",
        city: "City",
        position: "Position",
        department: "Department",
        manager: "Manager",
        joinDate: "Join Date",
        salary: "Basic Salary",
        bankName: "Bank Name",
        bankAccount: "Bank Account",
        emergencyContact: "Emergency Contact",
        relation: "Relation"
    },
    departments: {
        title: "Departments & Locations",
        subtitle: "Manage office zones and attendance geofences",
        employees: "Employees",
        remote: "Remote / No Geofence",
        radius: "Radius",
        zone: "Attendance Zone",
        useCurrentLoc: "Use Current Loc",
        verifyMap: "Verify on Google Maps",
        saveSettings: "Save Settings",
        edit: "Edit Department"
    },
    leaves: {
        title: "Leaves",
        subtitle: "Manage leave requests and approvals",
        noRequests: "No leave requests found",
        requestLeave: "Request Leave",
        myLeaves: "My Leaves",
        approvals: "Approvals",
        planning: "Planning",
        config: "Configuration",
        type: "Type",
        dates: "Dates",
        status: "Status",
        reason: "Reason",
        submit: "Submit",
        daysAllowed: "Days Allowed",
        paid: "Paid",
        unpaid: "Unpaid",
        employee: "Employee",
        actions: "Actions",
        roster: "Weekly Roster & Off Days"
    },
    payroll: {
        title: "Payroll",
        subtitle: "Process and manage employee salaries",
        runs: "Payroll Runs",
        payslips: "Payslips",
        runPayroll: "Run Payroll",
        month: "Month",
        employees: "Employees",
        totalNetPay: "Total Net Pay",
        status: "Status",
        draft: "Draft",
        approved: "Approved",
        processed: "Processed",
        generate: "Generate Payslips",
        approve: "Approve",
        viewDetails: "View Details",
        basicSalary: "Basic Salary",
        allowances: "Allowances",
        deductions: "Deductions",
        tax: "Tax",
        netSalary: "Net Salary",
        noRuns: "No payroll runs found"
    },
    projects: {
        title: "Projects",
        subtitle: "Manage projects and track progress",
        newProject: "New Project",
        projectName: "Project Name",
        description: "Description",
        department: "Department",
        lead: "Project Lead",
        deadline: "Deadline",
        progress: "Progress",
        status: "Status",
        active: "Active",
        completed: "Completed",
        onHold: "On Hold",
        cancelled: "Cancelled",
        noProjects: "No projects found"
    },
    recruitment: {
        title: "Recruitment",
        subtitle: "Manage job openings and candidates",
        jobs: "Job Openings",
        candidates: "Candidates",
        newJob: "Post New Job",
        jobTitle: "Job Title",
        department: "Department",
        location: "Location",
        salaryRange: "Salary Range",
        jobType: "Job Type",
        status: "Status",
        open: "Open",
        closed: "Closed",
        applied: "Applied",
        interview: "Interview",
        offered: "Offered",
        hired: "Hired",
        rejected: "Rejected",
        noJobs: "No job openings found",
        noCandidates: "No candidates found"
    },
    reports: {
        title: "Reports",
        subtitle: "View analytics and insights",
        hrReports: "HR Reports",
        attendance: "Attendance",
        payroll: "Payroll",
        leaves: "Leaves",
        headcount: "Headcount",
        export: "Export",
        noData: "No data available"
    },
    profile: {
        title: "Profile",
        subtitle: "View and edit your profile",
        personal: "Personal Info",
        job: "Job Info",
        contact: "Contact",
        salary: "Salary",
        password: "Password",
        changePassword: "Change Password",
        currentPassword: "Current Password",
        newPassword: "New Password",
        confirmPassword: "Confirm Password",
        save: "Save Changes"
    },
    settings: {
        title: "Settings",
        subtitle: "System configuration",
        general: "General",
        notifications: "Notifications",
        security: "Security",
        backup: "Backup",
        language: "Language",
        timezone: "Timezone",
        dateFormat: "Date Format"
    }
  },
  km: {
    nav: {
      dashboard: "ផ្ទាំងព័ត៌មាន",
      attendance: "វត្តមាន",
      leaves: "ច្បាប់ឈប់សម្រាក",
      projects: "គម្រោង",
      tasks: "កិច្ចការ",
      employees: "បុគ្គលិក",
      payroll: "ប្រាក់បៀវត្សរ៍",
      departments: "នាយកដ្ឋាន",
      reports: "របាយការណ៍",
      main: "មេនុយចម្បង",
      management: "ការគ្រប់គ្រង",
      profile: "ប្រវត្តិរូប",
      logout: "ចាកចេញ",
      chat: "សារ",
      recruitment: "ការជួល",
      settings: "ការកំណត់"
    },
    header: {
        notifications: "ការជូនដំណឹង",
        markAllRead: "គូសចំណាំថាបានអាន",
        noNotifications: "គ្មានការជូនដំណឹងថ្មីទេ",
        viewAll: "មើលទាំងអស់"
    },
    time: {
        justNow: "ឥឡូវនេះ",
        ago: "មុន",
        years: "ឆ្នាំ",
        months: "ខែ",
        days: "ថ្ងៃ",
        hours: "ម៉ោង",
        minutes: "នាទី"
    },
    common: {
      welcome: "សូមស្វាគមន៍",
      search: "ស្វែងរក...",
      loading: "កំពុងដំណើរការ...",
      status: "ស្ថានភាព",
      active: "សកម្ម",
      actions: "សកម្មភាព",
      save: "រក្សាទុក",
      add: "បន្ថែម",
      cancel: "បោះបង់",
      edit: "កែប្រែ",
      delete: "លុប",
      view: "មើល",
      close: "បិទ",
      unknown: "មិនស្គាល់",
      noPhone: "គ្មានលេខទូរស័ព្ទ"
    },
    logo: {
      subtitle: "ការពិគ្រោះ និង ពិគ្រោះធនធានមនុស្ស"
    },
    login: {
      welcomeBack: "សូមស្វាគមន៍មកវិញ",
      resetPassword: "កែប្រែពាក្យសម្ងាត់",
      enterOtp: "បញ្ចូល OTP",
      signInToAccess: "ចូលដើម្បីចូលទៅកាន់តំបន់ការងាររបស់អ្នក",
      enterPhoneForOtp: "បញ្ចូលលេខទូរស័ព្ទរបស់អ្នកដើម្បីទទួល OTP",
      weSentCode: "យើងបានផ្ញើកូដទៅ",
      phoneNumber: "លេខទូរស័ព្ទ"
    },
    messages: {
        imageSize: "រូបភាពត្រូវតែតូចជាង 2MB",
        loadError: "បរាជ័យក្នុងការផ្ទុកទិន្នន័យប្រព័ន្ធ",
        opFailed: "ប្រតិបត្តិការបរាជ័យ",
        enterNew: "បញ្ចូលថ្មី",
        added: "បានបន្ថែម"
    },
    dashboard: {
      hrOverview: "ទិដ្ឋភាពទូទៅធនធានមនុស្ស",
      teamOverview: "ទិដ្ឋភាពទូទៅក្រុម",
      totalEmployees: "បុគ្គលិកសរុប",
      presentToday: "វត្តមានថ្ងៃនេះ",
      pendingRequests: "សំណើកំពុងរង់ចាំ",
      openPositions: "មុខតំណែងទំនេរ",
      attendanceTrend: "និន្នាការវត្តមាន",
      deptDist: "ការបែងចែកនាយកដ្ឋាន",
      welcomeBack: "សូមស្វាគមន៍",
      todaysStatus: "ស្ថានភាពថ្ងៃនេះ",
      checkedIn: "បានចូលធ្វើការ",
      notCheckedIn: "មិនទាន់ចូល",
      shiftEnded: "ចប់ម៉ោងការងារ",
      remainingLeave: "ថ្ងៃឈប់សម្រាកនៅសល់",
      onTimeArrival: "ការមកទាន់ពេល"
    },
    attendance: {
      title: "វត្តមាន & ម៉ោងចូលធ្វើការ",
      currentStatus: "ស្ថានភាពបច្ចុប្បន្ន",
      clockIn: "ចូលធ្វើការ",
      clockOut: "ចេញពីធ្វើការ",
      locationCheck: "ត្រួតពិនិត្យទីតាំង",
      officeLocation: "ទីតាំងការិយាល័យ",
      yourLocation: "ទីតាំងរបស់អ្នក",
      distance: "ចម្ងាយពីការិយាល័យ",
      inZone: "ក្នុងតំបន់",
      outOfZone: "ក្រៅតំបន់",
      history: "ប្រវត្តិវត្តមាន",
      date: "កាលបរិច្ឆេទ",
      checkIn: "ម៉ោងចូល",
      checkOut: "ម៉ោងចេញ"
    },
    chat: {
        selectUser: "ជ្រើសរើសមិត្តរួមការងារដើម្បីចាប់ផ្តើមជជែក",
        typeMessage: "សរសេរសារ...",
        search: "ស្វែងរកមិត្តរួមការងារ...",
        online: "កំពុងប្រើ",
        offline: "ក្រៅបណ្តាញ"
    },
    tasks: {
        title: "កិច្ចការក្រុម",
        create: "បង្កើតកិច្ចការ",
        todo: "ត្រូវធ្វើ",
        inProgress: "កំពុងធ្វើ",
        done: "រួចរាល់"
    },
    employees: {
        title: "បុគ្គលិក",
        subtitle: "គ្រប់គ្រងសមាជិកក្រុមនិងតួនាទីរបស់ពួកគេ",
        searchPlaceholder: "ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬអត្តសញ្ញាណ...",
        newEmployee: "បុគ្គលិកថ្មី",
        table: {
            id: "អត្តសញ្ញាណ",
            employee: "បុគ្គលិក",
            role: "តួនាទី",
            department: "នាយកដ្ឋាន",
            status: "ស្ថានភាព",
            joined: "ថ្ងៃចូលធ្វើការ",
            actions: "សកម្មភាព"
        },
        details: {
            jobInfo: "ព័ត៌មានការងារ",
            compensation: "ប្រាក់បំណាច់",
            contact: "ព័ត៌មានទំនាក់ទំនង",
            basicSalary: "ប្រាក់ខែគោល",
            copyId: "អត្តសញ្ញាណត្រូវបានចម្លង"
        },
        confirmDelete: "តើអ្នកប្រាកដថាចង់លុបបុគ្គលិកនេះទេ?"
    },
    onboarding: {
        title: "ចុះឈ្មោះបុគ្គលិក",
        subtitle: "ការចុះឈ្មោះបុគ្គលិកថ្មី",
        editTitle: "កែប្រែប្រវត្តិរូប",
        editSubtitle: "កំពុងកែប្រែកំណត់ត្រាសម្រាប់",
        steps: {
            identity: "អត្តសញ្ញាណ",
            personal: "ផ្ទាល់ខ្លួន",
            placement: "ការងារ",
            contact: "ទំនាក់ទំនង",
            pay: "ប្រាក់បៀវត្សរ៍",
            family: "គ្រួសារ",
            review: "ពិនិត្យឡើងវិញ"
        },
        basics: {
            title: "អត្តសញ្ញាណស្នូល",
            desc: "ព័ត៌មានលម្អិតទាំងនេះបង្កើតអត្តសញ្ញាណតែមួយគត់របស់បុគ្គលិកនៅក្នុងប្រព័ន្ធ។ លេខសម្គាល់បុគ្គលិកត្រូវបានប្រើសម្រាប់ការចូលប្រើហើយមិនអាចផ្លាស់ប្តូរបានងាយស្រួលទេ។",
            employeeId: "លេខសម្គាល់បុគ្គលិក",
            autoGenerate: "បង្កើតលេខសម្គាល់ដោយស្វ័យប្រវត្តិ",
            email: "អាសយដ្ឋានអ៊ីមែល",
            firstName: "នាមត្រកូល",
            lastName: "នាមខ្លួន",
            accessLevel: "កម្រិតចូលប្រើប្រព័ន្ធ",
            managerRestricted: "កំណត់ដោយអ្នកគ្រប់គ្រង",
            standardEmployee: "បុគ្គលិកស្តង់ដារ",
            managerRestrictionMsg: "ក្នុងនាមជាអ្នកគ្រប់គ្រង អ្នកអាចចុះឈ្មោះបានតែបុគ្គលិកស្តង់ដារប៉ុណ្ណោះ។ ទាក់ទងអ្នកគ្រប់គ្រងប្រព័ន្ធសម្រាប់តួនាទីផ្សេងទៀត។",
            enablePortal: "បើកដំណើរការវិបផតថលសេវាកម្មខ្លួនឯង",
            portalDesc: "អនុញ្ញាតឱ្យអ្នកប្រើប្រាស់នេះចូលដើម្បីមើលប័ណ្ណបើកប្រាក់ខែ ស្នើសុំច្បាប់ និងពិនិត្យមើលវត្តមាន។"
        },
        roles: {
            admin: { label: "អ្នកគ្រប់គ្រងប្រព័ន្ធ", desc: "ការគ្រប់គ្រងប្រព័ន្ធពេញលេញ។ អាចគ្រប់គ្រងអ្នកប្រើប្រាស់ទាំងអស់ ការកំណត់ និងទិន្នន័យសំខាន់ៗ។" },
            hr: { label: "អ្នកគ្រប់គ្រងធនធានមនុស្ស", desc: "គ្រប់គ្រងការជ្រើសរើសបុគ្គលិក ប្រាក់បៀវត្សរ៍ វត្តមាន និងកំណត់ត្រាបុគ្គលិក។" },
            manager: { label: "អ្នកគ្រប់គ្រងក្រុម", desc: "មើលរបាយការណ៍ផ្ទាល់ អនុម័តច្បាប់ និងគ្រប់គ្រងគម្រោងក្រុម។" },
            employee: { label: "បុគ្គលិក", desc: "ការចូលប្រើជាមូលដ្ឋាន។ អាចមើលប្រវត្តិរូបខ្លួនឯង ប័ណ្ណបើកប្រាក់ខែ និងស្នើសុំច្បាប់។" }
        },
        personal: {
            title: "ព័ត៌មានផ្ទាល់ខ្លួន",
            desc: "ទិន្នន័យអត្តសញ្ញាណផ្លូវការដែលត្រូវការសម្រាប់កិច្ចសន្យាការងារ។",
            profilePhoto: "រូបថតប្រវត្តិរូប",
            change: "ផ្លាស់ប្តូរ",
            upload: "ផ្ទុកឡើង",
            photoRequirements: "អនុញ្ញាត *.jpeg, *.jpg, *.png\nទំហំអតិបរមា 5 MB",
            gender: "ភេទ",
            dob: "ថ្ងៃខែឆ្នាំកំណើត",
            nationality: "សញ្ជាតិ",
            nationalId: "អត្តសញ្ញាណប័ណ្ណ",
            passport: "លេខលិខិតឆ្លងដែន",
            ethnicity: "ជនជាតិ",
            religion: "សាសនា",
            optional: "ជម្រើស"
        },
        job: {
            title: "ព័ត៌មានលម្អិតការងារ",
            department: "នាយកដ្ឋាន",
            position: "តួនាទី",
            reportsTo: "រាយការណ៍ជូន",
            managerHelper: "អ្នកគ្រប់គ្រងមកពីនាយកដ្ឋានដែលបានជ្រើសរើសនឹងបង្ហាញមុន។",
            employmentType: "ប្រភេទការងារ",
            joinDate: "ថ្ងៃចូលធ្វើការ",
            probationEnd: "ថ្ងៃបញ្ចប់ការសាកល្បងការងារ",
            lockedDept: "បានចាក់សោចំពោះនាយកដ្ឋានរបស់អ្នក"
        },
        contact: {
            title: "ព័ត៌មានទំនាក់ទំនង",
            phone: "លេខទូរស័ព្ទ",
            email: "អ៊ីមែលផ្ទាល់ខ្លួន",
            emailHelper: "អ៊ីមែលបន្ទាប់បន្សំប្រសិនបើខុសពីការងារ",
            address: "អាសយដ្ឋាន",
            city: "ទីក្រុង / ខេត្ត",
            website: "គេហទំព័រ / ផលប័ត្រ"
        },
        salary: {
            baseComp: "ប្រាក់បំណាច់មូលដ្ឋាន",
            basicSalary: "ប្រាក់ខែគោល",
            currency: "រូបិយប័ណ្ណ",
            banking: "ព័ត៌មានធនាគារ",
            bankName: "ឈ្មោះធនាគារ",
            accountNumber: "លេខគណនី",
            payrollPreview: "ការមើលប្រាក់បៀវត្សរ៍ជាមុន",
            monthlyBreakdown: "ការវិភាគប្រចាំខែ",
            baseSalary: "ប្រាក់ខែគោល",
            allowances: "ប្រាក់ឧបត្ថម្ភ",
            deductions: "ការកាត់ប្រាក់",
            estimatedNet: "ប្រាក់ខែសុទ្ធប៉ាន់ស្មាន",
            equivalent: "សមមូល (ប្រហាក់ប្រហែល)",
            disclaimer: "ការគណនាផ្អែកលើគោលការណ៍ណែនាំច្បាប់ការងារកម្ពុជាឆ្នាំ ២០២៤។ ចំនួនទឹកប្រាក់ជាក់ស្តែងអាចប្រែប្រួលអាស្រ័យលើបន្ទុកគ្រួសារនិងវត្តមាន។"
        },
        family: {
            emergencyContact: "ទំនាក់ទំនងបន្ទាន់",
            desc: "ព័ត៌មាននេះមានសារៈសំខាន់សម្រាប់សុវត្ថិភាពបុគ្គលិក ហើយនឹងត្រូវបានចូលប្រើតែក្នុងករណីមានអាសន្ននៅកន្លែងធ្វើការប៉ុណ្ណោះ។",
            contactName: "ឈ្មោះទំនាក់ទំនង",
            relationship: "ទំនាក់ទំនង",
            phone: "លេខទូរស័ព្ទ"
        },
        review: {
            officialId: "អត្តសញ្ញាណផ្លូវការ",
            joined: "បានចូលរួម",
            type: "ប្រភេទ",
            pendingDocs: "ឯកសារដែលកំពុងរង់ចាំ",
            pendingDocsMsg: "ប្រព័ន្ធនឹងបង្កើតកិច្ចសន្យាបណ្តោះអាសន្ន។ បុគ្គលិកត្រូវដាក់ជូនច្បាប់ចម្លងអត្តសញ្ញាណប័ណ្ណនិងប័ណ្ណចាក់វ៉ាក់សាំងក្នុងរយៈពេល ៧ ថ្ងៃ។",
            identityAccess: "អត្តសញ្ញាណ & ការចូលប្រើ",
            personalDetails: "ព័ត៌មានលម្អិតផ្ទាល់ខ្លួន",
            placement: "ការងារ",
            compensation: "ប្រាក់បំណាច់",
            contactEmergency: "ទំនាក់ទំនង & គ្រាអាសន្ន",
            portalAccess: "ការចូលប្រើវិបផតថល",
            enabled: "បានបើក",
            disabled: "បានបិទ"
        },
        buttons: {
            next: "បន្ទាប់",
            back: "ត្រឡប់ក្រោយ",
            finish: "បញ្ចប់ការចុះឈ្មោះ",
            saveProfile: "រក្សាទុកប្រវត្តិរូប",
            saveDraft: "រក្សាទុកជាព្រាង",
            importCsv: "នាំចូល CSV"
        },
        messages: {
            saved: "បានរក្សាទុក",
            attention: "ត្រូវការការយកចិត្តទុកដាក់",
            fixErrors: "សូមកែតម្រូវចំណុចដែលបានគូសបញ្ជាក់ខាងក្រោមដើម្បីបន្ត។",
            success: "ប្រតិបត្តិការជោគជ័យ",
            draftSaved: "បានរក្សាទុកជាព្រាងដោយជោគជ័យ"
        }
    },
    form: {
        firstName: "នាមត្រកូល",
        lastName: "នាមខ្លួន",
        email: "អ៊ីមែល",
        phone: "លេខទូរស័ព្ទ",
        dob: "ថ្ងៃខែឆ្នាំកំណើត",
        gender: "ភេទ",
        nationality: "សញ្ជាតិ",
        address: "អាសយដ្ឋាន",
        city: "ទីក្រុង/ខេត្ត",
        position: "តួនាទី/តំណែង",
        department: "នាយកដ្ឋាន",
        manager: "អ្នកគ្រប់គ្រង",
        joinDate: "ថ្ងៃចូលធ្វើការ",
        salary: "ប្រាក់ខែគោល",
        bankName: "ឈ្មោះធនាគារ",
        bankAccount: "លេខគណនី",
        emergencyContact: "ទំនាក់ទំនងបន្ទាន់",
        relation: "ត្រូវជា"
    },
    departments: {
        title: "នាយកដ្ឋាន & ទីតាំង",
        subtitle: "គ្រប់គ្រងតំបន់ការិយាល័យ និងទីតាំងវត្តមាន",
        employees: "បុគ្គលិក",
        remote: "ធ្វើការពីចម្ងាយ / គ្មានទីតាំងកំណត់",
        radius: "កាំរង្វង់",
        zone: "តំបន់វត្តមាន",
        useCurrentLoc: "ប្រើទីតាំងបច្ចុប្បន្ន",
        verifyMap: "ផ្ទៀងផ្ទាត់លើ Google Maps",
        saveSettings: "រក្សាទុកការកំណត់",
        edit: "កែប្រែនាយកដ្ឋាន"
    },
    leaves: {
        title: "ច្បាប់ឈប់សម្រាក",
        subtitle: "គ្រប់គ្រងសំណើសុំច្បាប់និងការអនុម័ត",
        noRequests: "មិនមានសំណើសុំច្បាប់ទេ",
        requestLeave: "ស្នើសុំច្បាប់",
        myLeaves: "ច្បាប់របស់ខ្ញុំ",
        approvals: "ការអនុម័ត",
        planning: "ផែនការ",
        config: "ការកំណត់រចនាសម្ព័ន្ធ",
        type: "ប្រភេទ",
        dates: "កាលបរិច្ឆេទ",
        status: "ស្ថានភាព",
        reason: "មូលហេតុ",
        submit: "ដាក់ស្នើ",
        daysAllowed: "ចំនួនថ្ងៃអនុញ្ញាត",
        paid: "មានប្រាក់ឈ្នួល",
        unpaid: "គ្មានប្រាក់ឈ្នួល",
        employee: "បុគ្គលិក",
        actions: "សកម្មភាព",
        roster: "កាលវិភាគប្រចាំសប្តាហ៍ & ថ្ងៃឈប់សម្រាក"
    },
    payroll: {
        title: "ប្រាក់បៀវត្សរ៍",
        subtitle: "គ្រប់គ្រង និងបញ្ចូលប្រាក់បៀវត្សរ៍",
        runs: "ការបញ្ចូលប្រាក់",
        payslips: "បន្ទូលប្រាក់",
        runPayroll: "បញ្ចូលប្រាក់",
        month: "ខែ",
        employees: "បុគ្គលិក",
        totalNetPay: "ប្រាក់សរុប",
        status: "ស្ថានភាព",
        draft: "សេចក្តីព្រាង",
        approved: "អនុម័ត",
        processed: "បានដំណើរការ",
        generate: "បង្កើតបន្ទូល",
        approve: "អនុម័ត",
        viewDetails: "មើលព័ត៌មាន",
        basicSalary: "ប្រាក់ខែ",
        allowances: "ប្រាក់ឧបត្ថម្ភ",
        deductions: "ការកាត់បន្ថយ",
        tax: "ពន្ធ",
        netSalary: "ប្រាក់សុទ្ធ",
        noRuns: "គ្មានការបញ្ចូលទេ"
    },
    projects: {
        title: "គម្រោង",
        subtitle: "គ្រប់គ្រងគម្រោង និងតាមដាន",
        newProject: "គម្រោងថ្មី",
        projectName: "ឈ្មោះគម្រោង",
        description: "ការពិពណ៌នា",
        department: "នាយកដ្ឋាន",
        lead: "មេគម្រោង",
        deadline: "ថ្ងៃផុតកំណត់",
        progress: "វឌ្ឍនភាព",
        status: "ស្ថានភាព",
        active: "សកម្ម",
        completed: "បានបញ្ចប់",
        onHold: "ផ្អាក",
        cancelled: "បោះបង់",
        noProjects: "គ្មានគម្រោងទេ"
    },
    recruitment: {
        title: "ការជួល",
        subtitle: "គ្រប់គ្រងការងារ និងអ្នកដាក់ពាក្យ",
        jobs: "ការងារទំនេរ",
        candidates: "អ្នកដាក់ពាក្យ",
        newJob: "បង្កើតការងារ",
        jobTitle: "ចំណងជើងការងារ",
        department: "នាយកដ្ឋាន",
        location: "ទីតាំង",
        salaryRange: "ជួរប្រាក់",
        jobType: "ប្រភេទការងារ",
        status: "ស្ថានភាព",
        open: "បើក",
        closed: "បិទ",
        applied: "ដាក់ពាក្យ",
        interview: "សម្ភាស៍",
        offered: "ផ្តល់សេចក្តី",
        hired: "ជួល",
        rejected: "បដិសេធ",
        noJobs: "គ្មានការងារទេ",
        noCandidates: "គ្មានអ្នកដាក់ពាក្យទេ"
    },
    reports: {
        title: "របាយការណ៍",
        subtitle: "មើលទិន្នន័យ និងវិភាគ",
        hrReports: "របាយការណ៍ HR",
        attendance: "វត្តមាន",
        payroll: "ប្រាក់បៀវត្ស",
        leaves: "ច្បាប់ឈប់",
        headcount: "ចំនួនបុគ្គលិក",
        export: "នាំចេញ",
        noData: "គ្មានទិន្នន័យ"
    },
    profile: {
        title: "ប្រវត្តិរូប",
        subtitle: "មើល និងកែប្រែព័ត៌មាន",
        personal: "ព័ត៌មានផ្ទាល់ខ្លួន",
        job: "ព័ត៌មានការងារ",
        contact: "ទំនាក់ទំនង",
        salary: "ប្រាក់",
        password: "ពាក្យសម្ងាត់",
        changePassword: "ផ្លាស់ប្តូរពាក្យ",
        currentPassword: "ពាក្យសម្ងាត់បច្ចុប្បន្ន",
        newPassword: "ពាក្យសម្ងាត់ថ្មី",
        confirmPassword: "បញ្ជាក់ពាក្យ",
        save: "រក្សាទុក"
    },
    settings: {
        title: "ការកំណត់",
        subtitle: "កំណត់ប្រព័ន្ធ",
        general: "ទូទៅ",
        notifications: "ការជូនដំណឹង",
        security: "សុវត្ថភាព",
        backup: "បម្រុងទុក",
        language: "ភាសា",
        timezone: "ម៉ោង",
        dateFormat: "ទម្រង់កាលបរិច្ឆេទ"
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('hcms_lang') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('hcms_lang', language);
    // Update document language for accessibility
    document.documentElement.lang = language;
  }, [language]);

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = translations[language];
    
    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation missing for key: ${path} in language: ${language}`);
        return path;
      }
      current = current[key];
    }
    
    return current as string;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
