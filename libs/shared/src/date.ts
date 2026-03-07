export const getCurrentDate = () => {
  const isoDate = new Date().toISOString();
  const [date] = isoDate.split('T');
  if (!date) {
    throw new Error('Failed to get current date');
  }

  return date;
};
