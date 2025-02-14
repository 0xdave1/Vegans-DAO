import React from "react";
import {
  Avatar,
  AppBar,
  Box,
  Button,
  Toolbar,
  Tooltip,
  Typography,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { Link } from "react-router-dom";
import Web3 from "web3";
import { useTheme } from "@mui/material/styles";
import { useDispatch } from "react-redux";
import MenuIcon from "@mui/icons-material/Menu";
import { setToLS } from "../../Utils/storage";
import {
  RPC,
  vrtABI,
  vrtAddress,
  daoABI,
  daoAddress,
} from "../../Constants/config";

const web3 = new Web3(new Web3.providers.HttpProvider(RPC));
const vrtContract = new web3.eth.Contract(vrtABI, vrtAddress);
const daoContract = new web3.eth.Contract(daoABI, daoAddress);

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      account: "",
      position: "",
      isWalletConnected: false, // Add state variable for wallet connection status
    };
  }

  setDark = () => {
    this.props.dispatch({ type: "SET_THEME", payload: "dark" });
    setToLS("vegan-theme", "dark");
  };

  setLight = () => {
    this.props.dispatch({ type: "SET_THEME", payload: "light" });
    setToLS("vegan-theme", "light");
  };

  async walletConnect() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: web3.utils.toHex(1666600000) }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: web3.utils.toHex(1666600000),
                  chainName: "Harmony Mainnet",
                  rpcUrls: ["https://api.harmony.one"],
                  nativeCurrency: {
                    name: "ONE",
                    symbol: "ONE",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://explorer.harmony.one/"],
                },
              ],
            });
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: web3.utils.toHex(1666600000) }],
            });
          } catch (addError) {}
        }
      }

      try {
        await window.ethereum.enable();
        const clientWeb3 = new Web3(window.ethereum);
        const accounts = await clientWeb3.eth.getAccounts();
        this.setState({ account: accounts[0], isWalletConnected: true }); // Update state
        this.props.dispatch({ type: "SET_ACCOUNT", payload: accounts[0] });
        await this.getPosition(accounts[0]);

        window.ethereum.on("accountsChanged", async (accounts) => {
          const account = accounts.length > 0 ? accounts[0] : '';
          this.setState({ account, isWalletConnected: accounts.length > 0 }); // Update state
          if (account) {
            await this.getPosition(account);
          } else {
            this.props.dispatch({ type: "SET_ACCOUNT", payload: '' });
            this.props.dispatch({ type: "SET_POSITION", payload: 'GUEST' });
          }
        });

        window.ethereum.on("chainChanged", async (chainId) => {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: web3.utils.toHex(1666600000) }],
          });
        });

      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
      }
    } else {
      alert('No wallet detected. Please install a wallet extension like MetaMask.');
    }
  }

  async getPosition(address) {
    const balance = await vrtContract.methods.balanceOf(address).call();
    const owner = await daoContract.methods.owner().call();
    const admin = await daoContract.methods.admin().call();

    let position = "GUEST";
    if (address === owner) {
      position = "OWNER";
    } else if (address === admin) {
      position = "ADMIN";
    } else if (balance > 0) {
      position = "MEMBER";
    }

    this.setState({ position });
    this.props.dispatch({ type: "SET_POSITION", payload: position });
  }

  render() {
    return (
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1300,
          boxShadow: "none",
          bgcolor: this.props.theme.palette.background.default,
          backgroundImage: "unset",
          borderBottom: `1px solid ${this.props.theme.palette.divider}`,
          py: 2,
        }}
      >
        <Toolbar
          sx={{
            gap: this.props.matchUpMd ? 6 : 2,
            justifyContent: "space-between",
          }}
        >
          <Stack
            alignItems="center"
            flexDirection="row"
            gap={this.props.matchUpMd ? 6 : 2}
          >
            <Button
              size="small"
              edge="start"
              variant="outlined"
              aria-label="menu"
              onClick={() => this.props.handleDrawerOpen()}
              sx={{
                px: 1,
                minWidth: "unset",
                display: { sm: "block", md: "none" },
              }}
            >
              <MenuIcon />
            </Button>
            <Link to="/">
              <Box
                sx={{ display: { xs: "none", sm: "block" } }}
                component="img"
                src={
                  this.props.theme.palette.mode === "dark"
                    ? "/images/logo_main_white.png"
                    : "/images/logo_main.png"
                }
              />
            </Link>
            <Typography
              variant="h2"
              sx={{
                flexGrow: 1,
                color: this.props.theme.palette.text.primary,
                display: { xs: "none", md: "block" },
              }}
            >
              Vegan Rob’s DAO
            </Typography>
          </Stack>
          <Stack flexDirection="row" gap={5} alignItems="center">
            <Button
              variant="contained"
              color="success"
              disabled={this.state.account ? true : false}
              sx={{
                fontWeight: 700,
                display: { xs: "none", sm: "block" },
                color: this.props.theme.palette.common.white,
              }}
              onClick={() => this.walletConnect()}
            >
              Connect Wallet
            </Button>
            <Stack flexDirection="row" alignItems="center" gap={4}>
              <Stack
                flexDirection="row"
                alignItems="center"
                gap={1}
                sx={{
                  display: { xs: "none", sm: "flex" },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: this.props.theme.palette.text.primary,
                  }}
                />
                <Stack>
                  {this.state.account ? (
                    <Tooltip title={this.state.account}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: this.props.theme.palette.text.primary,
                        }}
                      >
                        {this.state.account.slice(0, 8)}...
                      </Typography>
                    </Tooltip>
                  ) : (
                    <></>
                  )}
                  <Typography
                    variant="overline"
                    sx={{
                      textTransform: "capitalize",
                      color: this.props.theme.palette.text.secondary,
                    }}
                  >
                    {this.state.position}
                  </Typography>
                </Stack>
              </Stack>
              {this.props.theme.palette.mode === "dark" ? (
                <Box
                  component="img"
                  src="/images/sun.png"
                  sx={{ cursor: "pointer" }}
                  onClick={this.setLight}
                />
              ) : (
                <Box
                  component="img"
                  src="/images/moon.png"
                  sx={{ cursor: "pointer" }}
                  onClick={this.setDark}
                />
              )}
            </Stack>
          </Stack>
        </Toolbar>
      </AppBar>
    );
  }
}

const withHook = (Header) => {
  return (props) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const matchUpMd = useMediaQuery(theme.breakpoints.up("md"));
    return (
      <Header
        theme={theme}
        dispatch={dispatch}
        {...props}
        matchUpMd={matchUpMd}
      />
    );
  };
};

export default withHook(Header);