// Export the hoverEffect function
export const hoverEffect = () => {
  // Select the top bar element
  const topBar = document.querySelector('.top-bar')
  // If the top bar doesn't exist, return an empty function
  if (!topBar) return () => {}

  // Handle mouse movement
  const handleMouseMove = (e) => {
    // Get the bounding rectangle of the top bar
    const rect = topBar.getBoundingClientRect()
    // Calculate the mouse position relative to the top bar
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Update CSS custom properties with the mouse position
    topBar.style.setProperty('--mouse-x', `${x}px`)
    topBar.style.setProperty('--mouse-y', `${y}px`)
  }

  // Handle mouse leave event
  const handleMouseLeave = () => {
    // Set mouse position to be off-screen when the mouse leaves
    topBar.style.setProperty('--mouse-x', '-9999px')
    topBar.style.setProperty('--mouse-y', '-9999px')
  }

  // Add event listeners
  document.addEventListener('mousemove', handleMouseMove)
  topBar.addEventListener('mouseleave', handleMouseLeave)

  // Return a cleanup function to remove event listeners
  return () => {
    document.removeEventListener('mousemove', handleMouseMove)
    topBar.removeEventListener('mouseleave', handleMouseLeave)
  }
}