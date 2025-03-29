import { Link } from 'react-router-dom'
import '../styles/Menu.scss'

export default function Menu() {
  return (
    <div className='menu-page'>
        <div className='menu-card'>
            <Link className='link' to='/singleplayer'>Single player</Link>
            <Link className='link' to='/multipayer'>Multiplyer</Link>
        </div>
    </div>
  )
}
