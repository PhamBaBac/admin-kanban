/** @format */

import {
    Avatar,
    Badge,
    Button,
    Drawer,
    Dropdown,
    Input,
    List,
    MenuProps,
    Space,
    Typography
} from 'antd';
import { Notification, SearchNormal1 } from 'iconsax-react';
import { colors } from '../constants/colors';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { authSeletor, removeAuth } from '../redux/reducers/authReducer';
import handleAPI from '../apis/handleAPI';
import { useEffect, useState } from 'react';
import { localDataNames } from '../constants/appInfos';


const HeaderComponent = () => {

	const user = useSelector(authSeletor);
      const [token, setToken] = useState<string>("");
    
      useEffect(() => {
        getData();
      }, []);
    
      const getData = async () => {
        const res: string = localStorage.getItem(localDataNames.token) || "";
        res && setToken(res);
      };
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const items: MenuProps['items'] = [
		{
			key: 'logout',
			label: 'Đăng xuất',
			onClick: async () => {
				await handleAPI("/auth/logout", { token: token }, "post");
				dispatch(removeAuth({}));
				localStorage.clear();

				navigate('/login');
			},
		},
	];

	return (
		<div className='p-2 row bg-white m-0'>
			<div className='col'>
				<Input
					placeholder='Search product, supplier, order'
					style={{
						borderRadius: 100,
						width: '100%',
					}}
					size='large'
					prefix={<SearchNormal1 className='text-muted' size={20} />}
				/>
			</div>
			<div className='col text-end'>
				<Space>
					<Button
						onClick={() => {}}
						type='text'
						icon={
							<Badge
								count={5}>
								<Notification size={22} color={colors.gray600} />
							</Badge>
						}
					/>
					<Dropdown menu={{ items }}>
						<Avatar src={user.photoUrl} size={40} />
					</Dropdown>
				</Space>
			</div>
		</div>
	);
};

export default HeaderComponent;