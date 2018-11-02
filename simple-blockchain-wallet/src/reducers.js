import { combineReducers } from "redux";

import wallet from "./modules/wallet/reducer";
import auth from "./modules/auth/reducer";
import loading from "./modules/loading/reducer";
import bitcoin from "./modules/bitcoin/reducer";

export default combineReducers({ loading, wallet, auth, bitcoin });
