# Cogana Bottom Sheet

Figma component set: `283:27`  
Page: `35 · Bottom Sheet` (`282:2`)  
Documentation frame: `283:28`

## Purpose

Temporary modal container for information, interface actions, or selection. The host screen validates and authorizes any business operation separately.

## Variants

- `Type=Informative`: title, supporting copy, and a dismiss control.
- `Type=Action`: title, supporting copy, primary action, and dismiss action.
- `Type=Selection`: title, supporting copy, selected option, and another option.

Every variant is 360 px wide. All controls are 44 px high.

## Accessibility

- Provide a visible dismissal route and platform-appropriate gesture behavior.
- Move focus into the sheet while open and restore it to the trigger when closed.
- State selection and errors in text, not only by styling.
- Each variant has independent editable copy and a hidden accessibility label.

## Boundaries

This is an interface container only. Do not use it to execute checkout, payments, cancellation, inventory changes, or order-status transitions without an authorized operation in the host flow.

## Validation

Validation confirmed three variants, 14 editable text properties, and controls at least 44 px high with no clipping or overlap.
