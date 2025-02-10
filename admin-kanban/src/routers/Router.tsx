import AuthRouter from "./AuthRouter"
import MainRouter from "./MainRouter"


const Router = () => {                                          
  return 1 > 2 ? <MainRouter/> : <AuthRouter />
}

export default Router