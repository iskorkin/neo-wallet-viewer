import React from "react";
import axios from "axios";
import injectSheet from "react-jss";
import PropTypes from "prop-types";
import { injectNOS, nosProps } from "@nosplatform/api-functions/lib/react";

const styles = {
  button: {
    margin: "16px",
    fontSize: "14px"
  }
};

class NOSActions extends React.Component {
  constructor() {
    super();

    this.state = {
      status: -1,
      neo_balance: "N/A",
      gas_balance: "N/A",
      neo_balance_usd: "N/A",
      gas_balance_usd: "N/A",
      total_balance_usd: "N/A"
    };
  }

  NEO_CONTRACT = "c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b";
  GAS_CONTRACT = "602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7";

  handleAlert = async func => alert(await func);

  // handleGetAddress = async () => alert(await this.props.nos.getAddress());

  loadAddress = async () => {
    const address = await this.props.nos.getAddress();
    if (address.length === 0) {
      return;
    }
    const stateClone = Object.assign({}, this.state);
    stateClone.address = address;
    this.setState(stateClone);
  };

  handleClaimGas = () =>
    this.props.nos
      .claimGas()
      .then(alert)
      .catch(alert);

  loadBalance = async () => {
    const { nos } = this.props;

    const cloneState = Object.assign({}, this.state);
    cloneState.status = 0;
    this.setState(cloneState);

    const neoBalance = await nos.getBalance({ asset: this.NEO_CONTRACT });
    const gasBalance = await nos.getBalance({ asset: this.GAS_CONTRACT });

    const neoPrice = await this.loadUsdPrice("NEO");
    const gasPrice = await this.loadUsdPrice("GAS");

    const neoBalanceUsd = neoBalance * neoPrice;
    const gasBalanceUsd = gasBalance * gasPrice;
    const totalUsd = neoBalanceUsd + gasBalanceUsd;

    this.setState({
      neo_balance: neoBalance,
      gas_balance: gasBalance,
      neo_balance_usd: neoBalanceUsd,
      gas_balance_usd: gasBalanceUsd,
      total_balance_usd: totalUsd,
      status: 1
    });
  };

  loadUsdPrice = async asset => {
    const listings = (await axios.get("https://api.coinmarketcap.com/v2/listings/")).data.data;
    let coinId = -1;
    for (let i = 0; i < listings.length; i++) {
      if (listings[i].symbol === asset) {
        coinId = listings[i].id;
        break;
      }
    }

    if (coinId < 0) {
      const msg = `Can't find price for coin ${asset}`;
      alert(msg);
      throw new Error(msg);
    }

    const info = (await axios.get(`https://api.coinmarketcap.com/v2/ticker/${coinId}/`)).data.data;
    return info.quotes.USD.price;
  };

  getUpdatedState = (asset, balance) => {
    const clonedState = Object.assign({}, this.state);
    const clonedBalances = Object.assign({}, clonedState.balances);
    clonedBalances[asset] = balance;
    clonedState.balances = clonedBalances;
    return clonedState;
  };

  render() {
    const { classes } = this.props;

    let inner;
    if (this.state.status === -1) {
      inner = <div />;
    } else if (this.state.status === 0) {
      inner = <div>Loading...</div>;
    } else {
      inner = (
        <div>
          <div>{`${this.state.neo_balance} NEO (${this.state.neo_balance_usd} $)`}</div>
          <div>{`${this.state.gas_balance} GAS (${this.state.gas_balance_usd} $)`}</div>
          <div>{`Total balance ${this.state.total_balance_usd} $`}</div>
        </div>
      );
    }

    return (
      <React.Fragment>
        <button className={classes.button} onClick={() => this.loadBalance()}>
          Load balance
        </button>
        {inner}
      </React.Fragment>
    );
  }
}

NOSActions.propTypes = {
  classes: PropTypes.objectOf(PropTypes.any).isRequired,
  nos: nosProps.isRequired
};

export default injectNOS(injectSheet(styles)(NOSActions));
