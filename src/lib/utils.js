// export function formatMessageTime(date) {
//   return new Date(date).toLocaleString("en-US", {
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: false, 
//   });
// }


export function formatMessageTime(date) {
  return new Date(date).toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    // day: "2-digit",
    // month: "short", // or "2-digit" if you prefer numbers
    // hour12: false,
  });
}
