import React from 'react';

/**
 * Component for displaying PostgreSQL database users
 * 
 * @param {Object} props Component properties
 * @param {Array} props.users List of database users
 * @returns {JSX.Element} Users list component
 */
const UsersList = ({ users }) => {
  const hasUsers = users && users.length > 0;

  return (
    <div>
      {hasUsers ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th className="py-2 px-3">Username</th>
                <th className="py-2 px-3">Active Connections</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={index} className={`bg-white border-b hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}>
                  <td className="py-2 px-3 font-medium">{user.usename}</td>
                  <td className="py-2 px-3">{user.connection_count}</td>
                  <td className="py-2 px-3">Regular</td>
                  <td className="py-2 px-3">Unknown</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-gray-500 text-sm italic">
          No user information available.
        </div>
      )}
    </div>
  );
};

export default UsersList;
