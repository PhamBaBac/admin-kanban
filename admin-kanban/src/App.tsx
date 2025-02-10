
import { message } from "antd";
import Router from "./routers/Router";
message.config({
	top: 20,
	duration: 2,
	maxCount: 3,
	rtl: true,
	prefixCls: 'my-message',
});

const App = () => {
  return (
    <div>
      <Router />
    </div>
  )
}

export default App