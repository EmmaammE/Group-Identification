const getType = () => sessionStorage.getItem('type')

const setType = (type: string) => {
  sessionStorage.setItem('type', type)
}

export {
  getType,
  setType
}