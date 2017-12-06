import React, { PureComponent } from 'react';
import { Modal, Icon } from 'antd';
import styles from './index.less';

export interface
DrawerProps
{
  title?: string;
  width?: string | number;
  position?: 'left' | 'right' | 'top' | 'bottom';
}

export default class Drawer extends PureComponent<DrawerProps, any> {
  static defaultProps = {
    title: '',
    width: 320,
    position: 'left',
  };
  constructor(props) {
    super(props);

    this.state = {
      open: false,
    };
  }
  onOpenChange = () => {
    this.setState({ open: !this.state.open });
  }
  render() {
    const { children, title, position, width, className } = this.props;
    let modalStyle = { top: 0, left: 0, bottom: 0, overflow: 'hidden', position: 'fixed', height: '100vh', margin: 'auto', padding: 0 };
    if (position === 'right') {
      modalStyle = { right: 0, top: 0, bottom: 0, overflow: 'hidden', position: 'fixed', height: '100vh', margin: 'auto', padding: 0 };
    } else if (position === 'top') {
      modalStyle = { top: 0, left: 0, right: 0, overflow: 'hidden', position: 'fixed', width: '100vh', margin: 'auto', padding: 0 };
    } else if (position === 'bottom') {
      modalStyle = { bottom: 0, left: 0, right: 0, overflow: 'hidden', position: 'fixed', width: '100vh', margin: 'auto', padding: 0 };
    }
    const box = (
      <Modal
        title={title}
        style={modalStyle}
        className={styles.drawer}
        visible={this.state.open}
        onCancel={this.onOpenChange}
        width={width}
        footer={[]}
      >
        {children}
      </Modal>
    );

    return (
      <span className={className}>
        <button onClick={this.onOpenChange} className={styles.btn} >
          <Icon type="setting" className={styles.icon} />
        </button>
        {box}
      </span>
    );
  }
}
