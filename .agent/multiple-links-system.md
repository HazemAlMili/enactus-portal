# 🔗 MULTIPLE LINKS UPLOAD SYSTEM

**Feature:** Upload multiple resource links (Head) and submission links (Member)  
**Status:** ⚠️ PARTIALLY IMPLEMENTED  
**Date:** December 16, 2025

---

## ✅ **WHAT'S IMPLEMENTED**

### **1. Backend Support** (Complete)

#### Task Model:
```typescript
// Changed from string to array
resourcesLink?: string[];  // Multiple resource links
submissionLink?: string[];  // Multiple submission links
```

#### Task Controller:
- Creates tasks with array of resource links
- Updates tasks with array of submission links
- Automatically filters out empty links

---

### **2. Frontend Logic** (Complete)

#### State Management:
```typescript
const [resourceLinks, setResourceLinks] = useState<string[]>(['']); // Multiple resources
const [submissionLinks, setSubmissionLinks] = useState<string[]>(['']); // Multiple submissions
```

#### Helper Functions:
```typescript
// Resource links
updateResourceLink(index, value)  // Auto-expands when typing
addResourceLink()                 // Manually add
removeResourceLink(index)         // Remove specific link

// Submission links
updateSubmissionLink(index, value) // Same auto-expand logic
addSubmissionLink()
removeSubmissionLink(index)
```

---

### **3. UI Components** (Resource Links Done)

#### Head's Create Task Form:
```tsx
<Label>INTEL LINKS</Label>
{resourceLinks.map((link, index) => (
  <div className="flex gap-1.5">
    <Input 
      value={link}
      onChange={e => updateResourceLink(index, e.target.value)}
      placeholder={`Link ${index + 1}: https://...`}
    />
    {resourceLinks.length > 1 && (
      <Button onClick={() => removeResourceLink(index)}>
        ✕
      </Button>
    )}
  </div>
))}
```

**Features:**
- ✅ Dynamic fields (auto-add when typing in last field)
- ✅ Remove button (appears when >1  link)
- ✅ Compact design (fits in row)
- ✅ Auto-filters empty links on submit

---

## ⚠️ **WHAT NEEDS FIXING**

### **4. TaskItem Component** (Submission Links UI)

The member's submission link inputs in the task dialog need to be updated similarly.

**Location:** Around lines 272-339 in the TaskItem component

**Need to change:**
```tsx
// OLD (single link)
<Input
  value={submissionLink}
  onChange={e => setSubmissionLink(e.target.value)}
/>

// NEW (multiple links)
{submissionLinks.map((link, index) => (
  <div key={index} className="flex gap-2">
    <Input 
      value={link}
      onChange={e => updateSubmissionLink(index, e.target.value)}
      placeholder={`Submission ${index + 1}: https://...`}
    />
    {submissionLinks.length > 1 && (
      <Button onClick={() => removeSubmissionLink(index)}>✕</Button>
    )}
  </div>
))}
```

**Update these lines:**
- Line 272: `submissionLink` → `submissionLinks`
- Line 283: `submissionLink` → `submissionLinks`
- Line 302: `submissionLink` → `submissionLinks`
- Line 314: `submissionLink` → `submissionLinks`
- Line 339: `setSubmissionLink` → `setSubmissionLinks`

---

### **5. Display Multiple Links** (View Mode)

When viewing task details, need to show all links properly:

```tsx
// Resource Links Display
{task.resourcesLink && task.resourcesLink.length > 0 && (
  <div>
    <Label>Resources:</Label>
    {task.resourcesLink.map((link, i) => (
      <a key={i} href={link} target="_blank" className="block text-secondary">
        📎 Link {i + 1}
      </a>
    ))}
  </div>
)}

// Submission Links Display
{task.submissionLink && task.submissionLink.length > 0 && (
  <div>
    <Label>Submissions:</Label>
    {task.submissionLink.map((link, i) => (
      <a key={i} href={link} target="_blank" className="block text-accent">
        📄 Submission {i + 1}
      </a>
    ))}
  </div>
)}
```

---

## 🎯 **HOW IT WORKS**

### **Auto-Expand Logic:**

```
User fills Link 1:
[https://drive.google.com/file1] ← User types here
                                 ↓
Auto-adds new field:
[https://drive.google.com/file1]
[                              ] ← New empty field appears!

User fills Link 2:
[https://drive.google.com/file1]
[https://drive.google.com/file2] ← User types
                                 ↓
[https://drive.google.com/file1]
[https://drive.google.com/file2]
[                              ] ← Another field!
```

### **Remove Button Logic:**

```
Multiple links:
[Link 1] [✕] ← Remove button appears
[Link 2] [✕]
[       ]

Single link:
[Link 1]     ← No remove button (minimum 1 field)
```

---

## 📋 **TESTING CHECKLIST**

### **Head - Resource Links:**
- [ ] Create task with 1 link - Works
- [ ] Create task with 3 links - Auto-expands correctly
- [ ] Remove middle link - Remaining links preserved
- [ ] Submit with empty links - Filtered out
- [ ] View task - All links displayed

### **Member - Submission Links:**
- [ ] Submit with 1 link - Works
- [ ] Submit with multiple links - Auto-expands
- [ ] Remove a link - Works correctly
- [ ] View submission - All links shown to Head

---

## 🛠️ **COMPLETION STEPS**

1. **Find TaskItem component** (around line 350+)
2. **Update submission link inputs** to use array logic
3. **Update task detail view** to display all links
4. **Test thoroughly** with real workflow

---

## 💡 **USER EXPERIENCE**

### **For Heads:**
```
Creating Task:
📎 INTEL LINKS
[https://drive.google.com/brief]      [✕]
[https://docs.google.com/template]    [✕]
[                                  ]  ← Auto-added

Result: 2 links saved (empty one filtered)
```

### **For Members:**
```
Submitting Task:
📄 SUBMISSION LINKS
[https://drive.google.com/video]      [✕]
[https://docs.google.com/report]      [✕]
[                                  ]  ← Auto-added

Result: 2 submissions saved
```

---

## 🎨 **UI DESIGN**

- Each link gets own row with input + remove button
- Remove button: Red with ✕ symbol
- Auto-expand: Seamless, no manual "Add" button needed
- Compact: Small height fields (h-8 instead of h-9)
- Clean: Empty links automatically removed on submit

---

## ✅ **BENEFITS**

### **Before (Single Link):**
- ❌ Members can only attach 1 file
- ❌ Need to zip multiple files
- ❌ Head can only provide 1 resource

### **After (Multiple Links):**
- ✅ Attach video, document, spreadsheet separately
- ✅ No zipping needed - direct links
- ✅ Head provides brief, template, examples
- ✅ Organized and clean
- ✅ Each file individually accessible

---

## 🔧 **TECHNICAL NOTES**

### **Array Handling:**
```typescript
// Filtering empty links before save
const filteredLinks = resourceLinks.filter(link => link.trim() !== '');

// Send to backend
resourcesLink: filteredLinks.length > 0 ? filteredLinks : []
```

### **Auto-Expand Trigger:**
```typescript
// Runs on every change
if (index === links.length - 1 && value.trim() !== '') {
  // If typing in last field and it's not empty
  setLinks([...links, '']); // Add new empty field
}
```

---

## 📈 **NEXT STEPS**

1. Update TaskItem submission inputs (5-10 min)
2. Update link display in task details (5 min)
3. Test full workflow (5 min)
4. Deploy and verify

**Total Time:** ~20 minutes to complete

---

**Status:** ⚠️ 80% Complete - Just need to update TaskItem component!

**Priority:** Medium - Current single link still works, this is enhancement
