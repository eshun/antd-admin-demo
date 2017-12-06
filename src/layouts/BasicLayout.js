import React from 'react';
import PropTypes from 'prop-types';
import DocumentTitle from 'react-document-title';

import { connect } from 'dva';
import { Link, Route, Redirect, Switch } from 'dva/router';
import { Layout, Menu, Icon, Avatar, Dropdown, Tag, message, Spin, Button, BackTop, Switch as BtnSwitch } from 'antd';
import NoticeIcon from 'ant-design-pro/lib/NoticeIcon';
import GlobalFooter from 'ant-design-pro/lib/GlobalFooter';

import moment from 'moment';
import groupBy from 'lodash/groupBy';
import classNames from 'classnames';
import { ContainerQuery } from 'react-container-query';

import Drawer from '../components/Drawer';
import { title, copyright } from '../common/config';

import NotFound from '../routes/Exception/404';
import styles from './BasicLayout.less';

const { Header, Sider, Content } = Layout;
const { SubMenu } = Menu;

const query = {
  'screen-xs': {
    maxWidth: 575,
  },
  'screen-sm': {
    minWidth: 576,
    maxWidth: 767,
  },
  'screen-md': {
    minWidth: 768,
    maxWidth: 991,
  },
  'screen-lg': {
    minWidth: 992,
    maxWidth: 1199,
  },
  'screen-xl': {
    minWidth: 1200,
  },
};

class BasicLayout extends React.PureComponent {
  static childContextTypes = {
    location: PropTypes.object,
    breadcrumbNameMap: PropTypes.object,
  }
  constructor(props) {
    super(props);
    // 把一级 Layout 的 children 作为菜单项
    this.menus = props.navData.reduce((arr, current) => arr.concat(current.children), []);
    this.state = {
      openKeys: this.getDefaultCollapsedSubMenus(props),
    };
  }
  getChildContext() {
    const { location, navData, getRouteData } = this.props;
    const routeData = getRouteData('BasicLayout');
    const firstMenuData = navData.reduce((arr, current) => arr.concat(current.children), []);
    const menuData = this.getMenuData(firstMenuData, '');
    const breadcrumbNameMap = {};

    routeData.concat(menuData).forEach((item) => {
      breadcrumbNameMap[item.path] = item.name;
    });
    return { location, breadcrumbNameMap };
  }
  componentDidMount() {
    this.props.dispatch({
      type: 'global/fetchCurrent',
    });
  }
  componentWillUnmount() {
    clearTimeout(this.resizeTimeout);
  }
  onCollapse = (collapsed) => {
    this.props.dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: collapsed,
    });
  }
  onMenuClick = ({ key }) => {
    if (key === 'logout') {
      this.props.dispatch({
        type: 'login/logout',
      });
    }
  }
  getMenuData = (data, parentPath) => {
    let arr = [];
    data.forEach((item) => {
      if (item.children) {
        arr.push({ path: `${parentPath}/${item.path}`, name: item.name });
        arr = arr.concat(this.getMenuData(item.children, `${parentPath}/${item.path}`));
      }
    });
    return arr;
  }
  getDefaultCollapsedSubMenus(props) {
    const currentMenuSelectedKeys = [...this.getCurrentMenuSelectedKeys(props)];
    currentMenuSelectedKeys.splice(-1, 1);
    if (currentMenuSelectedKeys.length === 0) {
      return ['dashboard'];
    }
    return currentMenuSelectedKeys;
  }
  getCurrentMenuSelectedKeys(props) {
    const { location: { pathname } } = props || this.props;
    const keys = pathname.split('/').slice(1);
    if (keys.length === 1 && keys[0] === '') {
      return [this.menus[0].key];
    }
    return keys;
  }
  getNavMenuItems(menusData, parentPath = '') {
    if (!menusData) {
      return [];
    }
    return menusData.map((item) => {
      if (!item.name) {
        return null;
      }
      let itemPath;
      if (item.path.indexOf('http') === 0) {
        itemPath = item.path;
      } else {
        itemPath = `${parentPath}/${item.path || ''}`.replace(/\/+/g, '/');
      }
      if (item.children && item.children.some(child => child.name)) {
        return (
          <SubMenu
            title={
              item.icon ? (
                <span>
                  <Icon type={item.icon} />
                  <span>{item.name}</span>
                </span>
              ) : item.name
            }
            key={item.key || item.path}
          >
            {this.getNavMenuItems(item.children, itemPath)}
          </SubMenu>
        );
      }
      const icon = item.icon && <Icon type={item.icon} />;
      return (
        <Menu.Item key={item.key || item.path}>
          {
            /^https?:\/\//.test(itemPath) ? (
              <a href={itemPath} target={item.target}>
                {icon}<span>{item.name}</span>
              </a>
            ) : (
              <Link
                to={itemPath}
                target={item.target}
                replace={itemPath === this.props.location.pathname}
              >
                {icon}<span>{item.name}</span>
              </Link>
            )
          }
        </Menu.Item>
      );
    });
  }
  getPageTitle() {
    const { location, getRouteData } = this.props;
    const { pathname } = location;
    let newTitle = title;
    getRouteData('BasicLayout').forEach((item) => {
      if (item.path === pathname) {
        newTitle = `${item.name} - ` + title;
      }
    });
    return newTitle;
  }
  getNoticeData() {
    const { notices = [] } = this.props;
    if (notices.length === 0) {
      return {};
    }
    const newNotices = notices.map((notice) => {
      const newNotice = { ...notice };
      if (newNotice.datetime) {
        newNotice.datetime = moment(notice.datetime).fromNow();
      }
      // transform id to item key
      if (newNotice.id) {
        newNotice.key = newNotice.id;
      }
      if (newNotice.extra && newNotice.status) {
        const color = ({
          todo: '',
          processing: 'blue',
          urgent: 'red',
          doing: 'gold',
        })[newNotice.status];
        newNotice.extra = <Tag color={color} style={{ marginRight: 0 }}>{newNotice.extra}</Tag>;
      }
      return newNotice;
    });
    return groupBy(newNotices, 'type');
  }
  handleOpenChange = (openKeys) => {
    const lastOpenKey = openKeys[openKeys.length - 1];
    const isMainMenu = this.menus.some(
      item => lastOpenKey && (item.key === lastOpenKey || item.path === lastOpenKey)
    );
    this.setState({
      openKeys: isMainMenu ? [lastOpenKey] : [...openKeys],
    });
  }
  toggle = () => {
    const { collapsed } = this.props;
    this.props.dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: !collapsed,
    });
    this.resizeTimeout = setTimeout(() => {
      const event = document.createEvent('HTMLEvents');
      event.initEvent('resize', true, false);
      window.dispatchEvent(event);
    }, 600);
  }
  handleNoticeClear = (type) => {
    message.success(`清空了${type}`);
    this.props.dispatch({
      type: 'global/clearNotices',
      payload: type,
    });
  }
  handleNoticeVisibleChange = (visible) => {
    if (visible) {
      this.props.dispatch({
        type: 'global/fetchNotices',
      });
    }
  }
  changeTheme = (currentTheme) => {
    this.props.dispatch({
      type: 'global/setTheme',
      payload: currentTheme,
    });
  }
  changeTopmenu = () => {
    this.props.dispatch({
      type: 'global/changeTopMenu',
    });
  }
  render() {
    const { currentUser, collapsed, fetchingNotices,
      getRouteData, currentTheme, topMenu } = this.props;

    const rightAsider = (
      <div>
        <div>
          <span><Icon type="bulb" />顶部菜单 </span>
          <BtnSwitch onChange={() => this.changeTopmenu()} defaultChecked={topMenu} />
        </div>
        <div>
          <span><Icon type="bulb" />主题颜色 </span>
          <Button onClick={() => this.changeTheme('dark')}>default</Button>
          <Button onClick={() => this.changeTheme('light')}>light</Button>
          <Button onClick={() => this.changeTheme('blue')}>blue</Button>
        </div>
      </div>
    );
    const siderClass = classNames(`baseLayout-sider-${currentTheme}`, styles.sider);
    const menuClass = classNames(`baseLayout-menu-${currentTheme}`, styles.menu);
    const menuTheme = currentTheme === 'light' ? 'light' : 'dark';

    const menu = (
      <Menu className={styles.menu} selectedKeys={[]} onClick={this.onMenuClick}>
        <Menu.Item disabled><Icon type="user" />个人中心</Menu.Item>
        <Menu.Item disabled><Icon type="setting" />设置</Menu.Item>
        <Menu.Divider />
        <Menu.Item key="logout"><Icon type="logout" />退出登录</Menu.Item>
      </Menu>
    );
    const noticeData = this.getNoticeData();

    // Don't show popup menu when it is been collapsed
    const menuProps = collapsed ? {} : {
      openKeys: this.state.openKeys,
    };
    const menuStyle = collapsed ? { display: 'block' } : {};

    const contentLayout = (
      <Content style={{ margin: '24px 24px 0', height: '100%' }}>
        <Switch>
          {
            getRouteData('BasicLayout').map(item =>
              (
                <Route
                  exact={item.exact}
                  key={item.path}
                  path={item.path}
                  component={item.component}
                />
              )
            )
          }
          <Redirect exact from="/" to="/dashboard" />
          <Route component={NotFound} />
        </Switch>
        <GlobalFooter
          copyright={copyright}
        />
        <BackTop />
      </Content>
    );
    const topLayout = (
      <Layout className={styles.baseLayout}>
        <Header className={styles.topmenu}>
          <div className={styles.logo}>
            <Link to="/">
              <img src="https://gw.alipayobjects.com/zos/rmsportal/iwWyPinUoseUxIAeElSx.svg" alt="logo" />
              <h1>{title}</h1>
            </Link>
          </div>
          <Menu
            theme="dark"
            mode={collapsed ? 'inline' : 'horizontal'}
            {...menuProps}
            onOpenChange={this.handleOpenChange}
            selectedKeys={this.getCurrentMenuSelectedKeys()}
            style={menuStyle}
          >
            {this.getNavMenuItems(this.menus)}
          </Menu>
          <div className={styles.right}>
            <NoticeIcon
              className={styles.action}
              count={currentUser.notifyCount}
              onItemClick={(item, tabProps) => {
                console.log(item, tabProps); // eslint-disable-line
              }}
              onClear={this.handleNoticeClear}
              onPopupVisibleChange={this.handleNoticeVisibleChange}
              loading={fetchingNotices}
              popupAlign={{ offset: [20, -16] }}
            >
              <NoticeIcon.Tab
                list={noticeData['通知']}
                title="通知"
                emptyText="你已查看所有通知"
                emptyImage="https://gw.alipayobjects.com/zos/rmsportal/wAhyIChODzsoKIOBHcBk.svg"
              />
              <NoticeIcon.Tab
                list={noticeData['消息']}
                title="消息"
                emptyText="您已读完所有消息"
                emptyImage="https://gw.alipayobjects.com/zos/rmsportal/sAuJeJzSKbUmHfBQRzmZ.svg"
              />
              <NoticeIcon.Tab
                list={noticeData['待办']}
                title="待办"
                emptyText="你已完成所有待办"
                emptyImage="https://gw.alipayobjects.com/zos/rmsportal/HsIsxMZiWKrNUavQUXqx.svg"
              />
            </NoticeIcon>
            {currentUser.name ? (
              <Dropdown overlay={menu}>
                <span className={`${styles.action} ${styles.account}`}>
                  <Avatar size="small" className={styles.avatar} src={require('../assets/user.png')} />
                  {currentUser.name}
                </span>
              </Dropdown>
            ) : <Spin size="small" style={{ marginLeft: 8 }} />}
            <Drawer
              title="主题设置"
              position="right"
              className={styles.action}
            >
              {rightAsider}
            </Drawer>
            <Icon
              className={styles.btnTop}
              type="bars"
              onClick={this.toggle}
            />
          </div>
        </Header>
        {contentLayout}
      </Layout>
    );
    const leftLayout = (
      <Layout className={styles.baseLayout}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          breakpoint="md"
          onCollapse={this.onCollapse}
          width={256}
          className={siderClass}
        >
          <div className={styles.logo}>
            <Link to="/">
              <img src="https://gw.alipayobjects.com/zos/rmsportal/iwWyPinUoseUxIAeElSx.svg" alt="logo" />
              <h1>{title}</h1>
            </Link>
          </div>
          <Menu
            theme={menuTheme}
            mode="inline"
            {...menuProps}
            onOpenChange={this.handleOpenChange}
            selectedKeys={this.getCurrentMenuSelectedKeys()}
            style={{ margin: '16px 0', width: '100%' }}
            className={menuClass}
          >
            {this.getNavMenuItems(this.menus)}
          </Menu>
        </Sider>
        <Layout>
          <Header className={styles.header}>
            <Icon
              className={styles.trigger}
              type={collapsed ? 'menu-unfold' : 'menu-fold'}
              onClick={this.toggle}
            />
            <div className={styles.right}>
              <NoticeIcon
                className={styles.action}
                count={currentUser.notifyCount}
                onItemClick={(item, tabProps) => {
                  console.log(item, tabProps); // eslint-disable-line
                }}
                onClear={this.handleNoticeClear}
                onPopupVisibleChange={this.handleNoticeVisibleChange}
                loading={fetchingNotices}
                popupAlign={{ offset: [20, -16] }}
              >
                <NoticeIcon.Tab
                  list={noticeData['通知']}
                  title="通知"
                  emptyText="你已查看所有通知"
                  emptyImage="https://gw.alipayobjects.com/zos/rmsportal/wAhyIChODzsoKIOBHcBk.svg"
                />
                <NoticeIcon.Tab
                  list={noticeData['消息']}
                  title="消息"
                  emptyText="您已读完所有消息"
                  emptyImage="https://gw.alipayobjects.com/zos/rmsportal/sAuJeJzSKbUmHfBQRzmZ.svg"
                />
                <NoticeIcon.Tab
                  list={noticeData['待办']}
                  title="待办"
                  emptyText="你已完成所有待办"
                  emptyImage="https://gw.alipayobjects.com/zos/rmsportal/HsIsxMZiWKrNUavQUXqx.svg"
                />
              </NoticeIcon>
              {currentUser.name ? (
                <Dropdown overlay={menu}>
                  <span className={`${styles.action} ${styles.account}`}>
                    <Avatar size="small" className={styles.avatar} src={require('../assets/user.png')} />
                    {currentUser.name}
                  </span>
                </Dropdown>
              ) : <Spin size="small" style={{ marginLeft: 8 }} />}
              <Drawer
                title="主题设置"
                position="right"
                className={styles.action}
              >
                {rightAsider}
              </Drawer>
            </div>
          </Header>
          {contentLayout}
        </Layout>
      </Layout>
    );
    const layout = topMenu ? topLayout : leftLayout;

    return (
      <DocumentTitle title={this.getPageTitle()}>
        <ContainerQuery query={query}>
          {params => <div className={classNames(params)}>{layout}</div>}
        </ContainerQuery>
      </DocumentTitle>
    );
  }
}

export default connect(state => ({
  currentUser: state.global.currentUser,
  topMenu: state.global.topMenu,
  currentTheme: state.global.currentTheme,
  collapsed: state.global.collapsed,
  fetchingNotices: state.global.fetchingNotices,
  notices: state.global.notices,
}))(BasicLayout);
