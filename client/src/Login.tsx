import { useCallback, useState } from "react";
import { useApi } from "./api";
import { error } from "./Error";

const Login = () => {
    const api = useApi();
    const [username, setUsername] = useState('');
    const onUsernameChange = useCallback(e => setUsername(e.target.value), [setUsername]);
    const [password, setPassword] = useState('');
    const onPasswordChange = useCallback(e => setPassword(e.target.value), [setPassword]);
    const login = useCallback(() => api.login(username, password).catch(e => {
        if (error(e).type === 'authorization') {
            setPassword("")
        } else {
            throw e
        }
    }), [api, username, password, setPassword]);
    const signUp = useCallback(() => api.signup(username, password).catch(e => {
        if (error(e).type === 'authorization') {
            setPassword('');
        } else {
            throw e
        }
    }), [api, username, password, setPassword]);

    return <div className="container">
        <h1 className="title level level-item">Login</h1>
        <hr />
        <div className="field block">
            <div className="control block">
                <input className="input" type="text" value={username} onChange={onUsernameChange} placeholder="Username" autoFocus />
            </div>
        </div>
        <div className="field block">
            <div className="control block">
                <input type="password" className="input" placeholder="Password" onChange={onPasswordChange} value={password} />
            </div>
        </div>
        <div className="buttons is-right">
            <button className="button is-primary" onClick={signUp}>Create Account</button>
            <button className="button is-primary" onClick={login}>Login</button>
        </div>
    </div>;
};

export default Login;
