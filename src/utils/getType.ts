const getType = () => sessionStorage.getItem('type') || 'local'

const setType = (type: string) => {
  sessionStorage.setItem('type', type)
}

export {
  getType,
  setType
}