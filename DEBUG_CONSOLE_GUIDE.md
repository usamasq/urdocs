# 🔍 **Debug Console Guide - Auto-Scroll Issues**

## 🎯 **How to Check Debug Logs**

### **1. Open Browser Console**
- Press **F12** or **Ctrl+Shift+I** (Windows/Linux)
- Press **Cmd+Option+I** (Mac)
- Click on the **Console** tab

### **2. Test the Navigation**
1. **Add some content** to create multiple pages
2. **Expand the navigation panel** (click the expand button)
3. **Click navigation buttons** and watch console output
4. **Use debug test buttons** in the expanded panel

## 📊 **Debug Logs to Look For**

### **🔍 Scroll Container Detection**
```
[GetScrollContainer] Searching for scroll container...
[GetScrollContainer] Found element with selector ".flex-1.overflow-y-auto": {...}
[GetScrollContainer] Using scroll container: .flex-1.overflow-y-auto
```

### **🎯 Navigation Panel Logs**
```
[Navigation Panel] Navigating from page 0 to page 1
[Navigation Panel] Page already at: 0
```

### **📄 Page Change Effect Logs**
```
[Page Change Effect] Current page changed to: 1
```

### **🔄 Scroll Function Logs**
```
[ScrollToPage] Called with pageIndex: 1
[ScrollToPage] Scroll container found: <div class="flex-1 overflow-y-auto...">
[ScrollToPage] Calculated scroll position: {...}
```

### **📐 Position Calculation Logs**
```
[CalculateScrollPosition] {
  pageIndex: 1,
  pageBreakPositions: [800, 1600],
  availableHeight: 800,
  marginTop: 30,
  containerHeight: 600,
  scrollPosition: 750,
  finalPosition: 750
}
```

## 🧪 **Debug Test Buttons**

### **In the Navigation Panel (Expanded Mode):**
- **Test Page 1**: Manually trigger scroll to page 0
- **Test Page 2**: Manually trigger scroll to page 1  
- **Test Container**: Check scroll container detection

### **Expected Output for Test Container:**
```
[Debug] Testing scroll container detection
[Debug] Scroll container found: <div class="flex-1 overflow-y-auto...">
[Debug] Container details: {
  scrollHeight: 2000,
  clientHeight: 600,
  scrollTop: 0
}
```

## 🚨 **Common Issues & Solutions**

### **❌ No Scroll Container Found**
```
[GetScrollContainer] No scroll container found!
```
**Solution**: Check if the DOM structure is correct

### **❌ Navigation Not Triggering**
```
// No logs when clicking buttons
```
**Solution**: Check if navigation panel is properly connected

### **❌ Page Change Not Working**
```
[Navigation Panel] Navigating from page 0 to page 1
// No [Page Change Effect] logs
```
**Solution**: Check if onPageChange prop is working

### **❌ Scroll Function Not Called**
```
[Page Change Effect] Current page changed to: 1
// No [ScrollToPage] logs
```
**Solution**: Check if useEffect is triggering

### **❌ Invalid Scroll Position**
```
[CalculateScrollPosition] {
  pageIndex: 1,
  pageBreakPositions: [],
  scrollPosition: 0
}
```
**Solution**: Check if page breaks are calculated

## 🔧 **Manual Testing Commands**

### **Test Scroll Container in Console:**
```javascript
// Check if scroll container exists
const container = document.querySelector('.flex-1.overflow-y-auto');
console.log('Container found:', container);
console.log('Scroll height:', container?.scrollHeight);
console.log('Client height:', container?.clientHeight);
```

### **Test Manual Scrolling:**
```javascript
// Test if scrolling works at all
const container = document.querySelector('.flex-1.overflow-y-auto');
if (container) {
  container.scrollTo({ top: 500, behavior: 'smooth' });
}
```

### **Check Page Break Elements:**
```javascript
// Look for page break indicators
const pageBreaks = document.querySelectorAll('.page-break-line');
console.log('Page breaks found:', pageBreaks.length);
```

## 📋 **Debug Checklist**

### **✅ Basic Checks:**
- [ ] Console is open and showing logs
- [ ] Navigation panel is expanded
- [ ] Content exists to create multiple pages
- [ ] Test buttons are visible

### **✅ Navigation Flow:**
- [ ] Click navigation button → see navigation log
- [ ] Page change effect triggers → see page change log
- [ ] Scroll function called → see scroll log
- [ ] Position calculated → see calculation log
- [ ] Actual scrolling occurs

### **✅ Container Detection:**
- [ ] Scroll container found → see container log
- [ ] Container has scrollable content
- [ ] Container dimensions are reasonable

### **✅ Page Break Calculation:**
- [ ] Page breaks are calculated
- [ ] Page break positions are valid
- [ ] Overflow info is available

## 🎯 **Expected Working Flow**

1. **Click "Next Page" button**
2. **See navigation log**: `[Navigation Panel] Navigating from page 0 to page 1`
3. **See page change log**: `[Page Change Effect] Current page changed to: 1`
4. **See scroll log**: `[ScrollToPage] Called with pageIndex: 1`
5. **See container log**: `[GetScrollContainer] Using scroll container: .flex-1.overflow-y-auto`
6. **See position log**: `[CalculateScrollPosition] { pageIndex: 1, ... }`
7. **See actual scrolling** in the document

## 🚀 **Next Steps**

1. **Run the application** and open console
2. **Test navigation buttons** and watch logs
3. **Use debug test buttons** to isolate issues
4. **Check each step** in the expected flow
5. **Identify where the flow breaks** and fix that specific issue

The debug system will show you exactly where the auto-scroll is failing!
