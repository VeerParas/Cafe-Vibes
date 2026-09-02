# Cafe Vibes — Product Guide

A local, browser-based billing and business analytics app for Cafe Vibes.
No server, no installation, no login server — everything runs inside your browser and all data is stored on the computer you use.

Version: 1.0 · Designed & Built by Paras Veer

---

## 1. What's in the folder

| File / Folder | Purpose |
|---|---|
| `index.html` | Welcome page. Choose Admin or User. |
| `order.html` | New Order page — take orders, bill customers, send WhatsApp receipts. |
| `business-analytics.html` | Admin page — configuration, daily/monthly costs, dashboard with charts, Excel import/export. |
| `app.js` | All application logic for both pages. |
| `app.extras.js` | Reserved placeholder for future page-specific additions. |
| `Logo.png` | Cafe logo shown in the header of every page. |
| `photos/` | Optional menu item photos (see section 5). |
| `Cafe-Vibes-Product-Guide.md` | This guide. |
| `.gitignore` | Keeps machine junk and private Excel files out of version control. |

---

## 2. Starting the app

1. Open the `Cafe Vibes` folder.
2. Double-click **`index.html`**. It opens in your default browser.
3. Choose your role:
   - **User** → goes to the New Order page (day-to-day billing).
   - **Admin** → asks for the admin password, then opens the Analytics & Configuration page.

**Default admin password:** `admin123` — change it immediately (see section 4.4).

**Tip:** Bookmark `index.html` in the browser, or drag it onto the bookmarks bar, so staff can open it in one click each morning.

**Recommended browser:** Google Chrome, Microsoft Edge or Safari, kept up to date.

---

## 3. The Order page (`order.html`)

### 3.1 Add items to the bill
- Tap any menu tile to add 1 quantity.
- Right-click a tile to reduce 1 quantity.
- Use the search box to filter the menu by item name; **Clear** resets it.
- In the cart you can use `+` / `-` per row, or **Remove** to delete a line.

### 3.2 Customer & table details
- **Select Table** — Takeaway/Delivery or Table 1–4. This is never saved into a customer profile, so it always reflects what you pick now.
- **Saved Customer** — start typing a saved customer's name (or phone) and pick the suggestion. Their mobile number, name and payment type fill in automatically.
  - **Save Current** — stores the phone + name + payment type currently in the form as a regular customer.
  - **Remove** — deletes the customer that is currently typed/selected.
- **New Customer** — mobile number (required to send the WhatsApp bill) and name.
- **Payment Type** — Cash, UPI or Card. This is only a label recorded with the order.
- **WhatsApp Message Language** — English or Marathi receipt wording.

### 3.3 Finishing an order
- **Send WhatsApp bill** opens WhatsApp with a pre-filled receipt for the customer's number, and saves the order locally.
- **Hold order** parks the current cart so you can start another bill; resume or delete it from the hold list.
- **Today's orders summary** shows order count, items, total sales and the Cash / UPI / Card split for the day.

---

## 4. The Admin page (`business-analytics.html`)

Two top-level tabs: **Configuration Panel** and **Analytics Panel**.

### 4.1 Menu Items
- Edit item names and prices inline, then press **Save Menu Changes**.
- **Add Item** appends a new item (raw cost is estimated at 35% of the selling price).
- **Remove** deletes a row — remember to save afterwards.
- **Import Data** uploads an Excel workbook (see section 6).

### 4.2 Menu Photos
A read-only preview grid of every menu item with its photo and price.

### 4.3 WhatsApp Settings
Choose the default receipt language (English / Marathi).

### 4.4 Admin Access
Set a new admin password (minimum 4 characters, entered twice). This password protects the Admin button on the welcome page.
*The password is stored only in this browser and is never included in any Excel export.*

### 4.5 Data Workbook
**Export All Data to Excel** downloads `cafe-vibes-data-workbook.xlsx` — your complete backup. Do this at least once a week (see section 7).

### 4.6 Analytics Panel
- **Daily Entry** — pick a date; sales fill in automatically from saved orders. Enter Dairy, Veggies, Raw Materials and Miscellaneous costs, then **Save Entry**. The log below lists every saved day and can be exported to Excel.
- **Monthly Fixed Costs** — pick a month and enter Electricity, Water, Staff and Gas.
- **Master Dashboard** — all-time totals, three charts and a month-by-month performance table:
  - *Sales, Cost & Net Profit by Month* — bars for sales and total cost, line for net profit (last 12 months).
  - *Where the Money Goes* — doughnut split of Dairy, Veggies, Raw Materials, Miscellaneous and Fixed Charges.
  - *Top Selling Items* — quantities sold across all orders.

---

## 5. Menu photos

Photos are looked up from the `photos/` folder by item name. To add one:

1. Save the image as a `.png`.
2. Name the file **exactly** like the menu item, e.g. `Veg Momos (Steam).png`.
3. Put it in the `photos/` folder and refresh the page.

If no matching file is found, the app falls back to a generic online photo (requires internet). Missing photos never break the app.

---

## 6. Excel import & export

### 6.1 Exporting
| Button | File produced |
|---|---|
| Data Workbook → **Export All Data to Excel** | `cafe-vibes-data-workbook.xlsx` (full backup) |
| Daily Entry → **Export to Excel** | `cafe-vibes-daily-log.xlsx` |
| Monthly Fixed Costs → **Export to Excel** | `cafe-vibes-monthly-costs.xlsx` |
| Master Dashboard → **Export to Excel** | `cafe-vibes-master-dashboard.xlsx` |

### 6.2 Importing
Use **Import Data** (in the Menu Items section). It reads every sheet it recognises in one go.

| Data | Accepted sheet names | Expected columns |
|---|---|---|
| Daily business data | `Daily_Entry`, `Buisness Data per day`, `Business Data per day`, `Daily Data` | `Date` (YYYY-MM-DD), `Dairy`, `Veggies`, `Raw Materials`, `Miscellaneous` |
| Monthly fixed costs | `Monthly_Fixed_Cost`, `Buisness Data per month`, `Business Data per month`, `Monthly Data` | `Month` (YYYY-MM), `Electricity`, `Water`, `Staff`, `Gas` |
| Saved customers | `Regular Customers`, `Regular_Customers`, `Saved Customers`, `Customers` | `Name`, `Phone`, `Payment Type` |
| Menu | `Menu_Items`, `Menu Items`, `Menu` | `item_name`, `selling_price`, `raw_cost` |
| Orders | `Orders`, `Order Log`, `Sales` | `Order ID`, `Date Time`, `Table`, `Customer Name`, `Customer Phone`, `Payment Type`, `Item`, `Qty`, `Price`, `Order Total`, `Order Cost` |
| Settings | `Settings`, `Configuration`, `Config` | `Setting`, `Value` |

Sheet names are matched loosely — case, spaces and underscores don't matter.

**How merging works**
- Daily rows are matched by **date**, monthly rows by **month** — an imported row replaces that day/month.
- Orders are matched by **Order ID** — existing IDs are skipped, so re-importing never creates duplicates.
- Customers are matched by **phone number** — existing customers are updated, new ones added.
- Menu items are matched by **name** — only genuinely new names are added; existing prices are untouched.
- The admin password is **never** exported or imported.

---

## 7. Backups (important)

All your data lives in this browser's local storage on this one computer. It is lost if you clear browsing data, uninstall the browser, use a different browser or user profile, or the machine fails.

**Weekly routine:**
1. Admin → Configuration Panel → Data Workbook → **Export All Data to Excel**.
2. Copy the downloaded `.xlsx` to a pen drive or cloud folder, with the date in the filename.

To restore on a new machine: copy the whole `Cafe Vibes` folder over, open `business-analytics.html`, and use **Import Data** on your latest backup workbook.

---

## 8. Troubleshooting guide

### 8.1 Startup & general

| Symptom | Cause | Fix |
|---|---|---|
| Page opens as plain text or code | The file was opened in a text editor | Right-click the file → Open With → your browser |
| Logo missing on every page | `Logo.png` was moved or renamed | Put a file named exactly `Logo.png` back in the main folder |
| Layout looks broken / old | Cached stylesheet | Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + F5` (Windows) |
| Nothing responds to clicks | JavaScript blocked or a script failed | Refresh the page; open the browser console (`F12` → Console) and read the first red error |
| Everything animates and feels busy | OS "reduce motion" is off | Enable Reduce Motion in your OS accessibility settings — the app respects it automatically |

### 8.2 Admin access

| Symptom | Cause | Fix |
|---|---|---|
| "Incorrect password. Access denied." | Wrong password, or it was changed on another browser | Use the password set in *this* browser. If forgotten, see below |
| Forgot the admin password | Password lives only in local storage | Open `business-analytics.html` directly (bypasses the prompt), then set a new password under Admin Access |
| Password asks again after every refresh | Normal | Access is prompted per navigation by design |

### 8.3 Orders & billing

| Symptom | Cause | Fix |
|---|---|---|
| "Cart is empty. Add items first." | No items selected | Tap menu tiles before sending the bill |
| "Please enter customer mobile number." | Phone field blank | WhatsApp needs a number; enter 10 digits or `+91…` |
| WhatsApp doesn't open | Pop-up blocked | Allow pop-ups for this page in the browser's address-bar icon |
| WhatsApp opens with no message | Number formatting | Re-enter the number using digits only |
| Saved customer won't auto-fill | Typed text doesn't match a saved entry | Pick the suggestion from the dropdown list rather than typing freely |
| Table keeps resetting | Intended | Table is deliberately not stored with a customer profile |

### 8.4 Menu

| Symptom | Cause | Fix |
|---|---|---|
| Edited prices revert | Changes weren't saved | Press **Save Menu Changes** after editing |
| "…already exists in the menu." | Duplicate item name | Rename the item, or edit the existing row instead |
| Item won't add | Name blank or price is 0 | Enter a name and a price greater than 0 |
| Photo not showing | Filename doesn't match the item name | Rename the file in `photos/` to match exactly, including spaces and brackets |

### 8.5 Analytics & charts

| Symptom | Cause | Fix |
|---|---|---|
| Charts area is blank | Chart library couldn't load (offline) | Connect to the internet and refresh |
| Charts squashed or invisible after switching tabs | Rare rendering timing issue | Switch to another tab and back to Master Dashboard |
| "No monthly data yet." | No orders or cost entries exist | Save at least one order or one daily entry |
| Sales show 0 for a date | No orders were saved on that date | Sales come from saved orders only and can't be typed manually |
| Net profit looks wrong | Fixed costs are counted per month, not per day | Check both Daily Entry and Monthly Fixed Costs for that period |

### 8.6 Excel import / export

| Symptom | Cause | Fix |
|---|---|---|
| "Excel engine failed to load…" | Excel library blocked (offline) | Connect to the internet and refresh the page |
| "Could not read that file…" | Not a real `.xlsx`, or the file is open in Excel | Close the file in Excel and re-select it; save as `.xlsx` if it's `.csv` |
| "No matching sheets found…" | Sheet names don't match | Rename sheets using the names in section 6.2 |
| Rows imported but values are 0 | Column headers don't match | Use the exact column names in section 6.2 |
| Dates imported wrong | Cells formatted as text | Format the Date column as a date, or type `YYYY-MM-DD` |
| Nothing downloads on export | Download blocked | Allow downloads for this page; check the browser's Downloads folder |
| Import didn't add customers | Rows missing name or phone | Both `Name` and `Phone` must be filled in |

### 8.7 Data loss & recovery

| Symptom | Cause | Fix |
|---|---|---|
| All data gone after clearing browsing data | Local storage was wiped | Restore with **Import Data** from your latest backup workbook |
| Different data in Chrome vs Safari | Storage is per browser | Always use the same browser; move data across with export → import |
| Data missing after moving the folder | Storage is tied to the file location on some browsers | Keep the folder in one fixed location; restore from backup if needed |
| Browser warns "storage full" | Very large order history | Export a backup, then trim old orders from the workbook and re-import into a fresh browser profile |

### 8.8 When nothing else works

1. Export a backup first, if the Admin page still opens.
2. Hard refresh the page (`Cmd + Shift + R` / `Ctrl + F5`).
3. Try the same file in a different browser.
4. Open the console (`F12` → Console) and note the first red error line — that message identifies the cause.
5. Re-import your latest backup workbook.

---

## 9. Good habits

- Export the data workbook every week and keep a dated copy off the machine.
- Enter daily costs at closing time while the numbers are fresh.
- Enter monthly fixed costs on the 1st of each month.
- Keep the same browser and the same computer for billing.
- Change the admin password from the default and don't share it with counter staff.
