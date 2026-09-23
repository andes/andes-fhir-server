import { ips } from './../../controller/ips/ips';

export = {
	searchById: async (args) => {
		try {
			// verify token IPS
			let { base_version, id } = args;
			if (id) {
				return await ips(base_version, id);
			} else {
				return null;
			}
		} catch (err) {
			return err;
		}
	}
};



